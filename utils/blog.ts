import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { imageSize } from 'image-size'
import { DateTime } from 'luxon'
import { remark } from 'remark'
import html from 'remark-html'
import { parse as parseYaml } from 'yaml'

export interface PostAttributes {
  audio?: string
  /** UTC ISO 8601 string, so it survives Next.js props serialization. */
  date: string
  title: string
  video?: string
}

export interface Post {
  attributes: PostAttributes
  html: string
  slug: string
}

export interface BlogPaths {
  postsDirectory?: string
  publicDirectory?: string
}

export class PostError extends Error {
  readonly file: string

  constructor(file: string, message: string, options?: ErrorOptions) {
    super(`${file}: ${message}`, options)
    this.name = 'PostError'
    this.file = file
  }
}

const imgTagRe = /<img\s+([^>]*?)\/?\s*>/g
const srcRe = /src="([^"]+)"/
const externalSrcRe = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i
const markdown = remark().use(html)

const resolvePaths = ({ postsDirectory, publicDirectory }: BlogPaths) => ({
  postsDirectory: postsDirectory ?? path.join(process.cwd(), 'posts'),
  publicDirectory: publicDirectory ?? path.join(process.cwd(), 'public'),
})

/** Resolves a site-relative URL path to a file inside `root`, or null if it escapes. */
export function resolvePublicFile(
  root: string,
  urlPath: string
): string | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(urlPath)
  } catch {
    return null
  }
  const resolvedRoot = path.resolve(root)
  const filePath = path.resolve(resolvedRoot, `.${path.posix.sep}${decoded}`)
  return filePath.startsWith(resolvedRoot + path.sep) ? filePath : null
}

export function addImageDimensions(
  contentHtml: string,
  publicDirectory: string
): string {
  return contentHtml.replace(imgTagRe, (match) => {
    const src = match.match(srcRe)?.[1]
    if (!src || externalSrcRe.test(src)) return match

    const filePath = resolvePublicFile(publicDirectory, src)
    if (!filePath) return match

    try {
      if (!fs.statSync(/*turbopackIgnore: true*/ filePath).isFile())
        return match
      const { width, height } = imageSize(
        fs.readFileSync(/*turbopackIgnore: true*/ filePath)
      )
      if (!width || !height) return match
      return match.replace(/\/?\s*>$/, ` width="${width}" height="${height}">`)
    } catch {
      return match
    }
  })
}

const isHttpOrRelativeUrl = (value: string): boolean => {
  try {
    return ['http:', 'https:'].includes(
      new URL(value, 'http://localhost').protocol
    )
  } catch {
    return false
  }
}

function parseDate(file: string, value: unknown): string {
  if (value === undefined || value === null) {
    throw new PostError(file, 'front matter is missing required "date"')
  }
  let date: Date | null = null
  if (value instanceof Date) {
    date = value
  } else if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)
  ) {
    const parsed = DateTime.fromISO(value, { zone: 'utc' })
    date = parsed.isValid ? parsed.toJSDate() : null
  }
  if (!date || Number.isNaN(date.getTime())) {
    throw new PostError(
      file,
      `front matter "date" must be an ISO 8601 date, got ${JSON.stringify(value)}`
    )
  }
  return date.toISOString()
}

function parseMediaUrl(
  file: string,
  key: 'audio' | 'video',
  value: unknown
): string | undefined {
  if (value === undefined) return undefined
  if (
    typeof value !== 'string' ||
    value.trim() === '' ||
    !isHttpOrRelativeUrl(value)
  ) {
    throw new PostError(
      file,
      `front matter "${key}" must be an http(s) URL or site-relative path, got ${JSON.stringify(value)}`
    )
  }
  return value
}

export function parseAttributes(file: string, data: unknown): PostAttributes {
  const record = (data ?? {}) as Record<string, unknown>
  const { title } = record
  if (typeof title !== 'string' || title.trim() === '') {
    throw new PostError(
      file,
      'front matter is missing required "title" (non-empty string)'
    )
  }
  const audio = parseMediaUrl(file, 'audio', record.audio)
  const video = parseMediaUrl(file, 'video', record.video)
  return {
    ...(audio !== undefined && { audio }),
    date: parseDate(file, record.date),
    title,
    ...(video !== undefined && { video }),
  }
}

export async function parsePost(
  file: string,
  source: string,
  slug: string,
  publicDirectory: string
): Promise<Post> {
  let parsed: matter.GrayMatterFile<string>
  try {
    parsed = matter(source, { engines: { yaml: parseYaml } })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new PostError(file, `invalid front matter: ${reason}`, {
      cause: error,
    })
  }
  const attributes = parseAttributes(file, parsed.data)
  const rendered = await markdown.process(parsed.content)
  return {
    attributes,
    html: addImageDimensions(rendered.toString(), publicDirectory),
    slug,
  }
}

export function getPostSlugs(paths: BlogPaths = {}): string[] {
  const { postsDirectory } = resolvePaths(paths)
  return fs
    .readdirSync(/*turbopackIgnore: true*/ postsDirectory, {
      withFileTypes: true,
    })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name.replace(/\.md$/, ''))
    .sort()
}

export async function getPostBySlug(
  slug: string,
  paths: BlogPaths = {}
): Promise<Post> {
  if (!slug || slug.startsWith('.') || slug !== path.basename(slug)) {
    throw new Error(`Invalid post slug: ${JSON.stringify(slug)}`)
  }
  const { postsDirectory, publicDirectory } = resolvePaths(paths)
  const source = fs.readFileSync(
    path.join(postsDirectory, `${slug}.md`),
    'utf8'
  )
  return parsePost(`posts/${slug}.md`, source, slug, publicDirectory)
}

export async function getBlogPostsData(paths: BlogPaths = {}): Promise<Post[]> {
  return Promise.all(
    getPostSlugs(paths).map((slug) => getPostBySlug(slug, paths))
  )
}

export function sortPostsNewestFirst(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) =>
      Date.parse(b.attributes.date) - Date.parse(a.attributes.date) ||
      a.slug.localeCompare(b.slug)
  )
}
