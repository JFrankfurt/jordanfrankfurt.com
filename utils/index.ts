import { Feed, Item } from 'feed'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getBlogPostsData, Post } from './blog'
import { EnclosureOptions, getEnclosureLength } from './enclosure'

export interface FeedBuildOptions {
  fetch?: EnclosureOptions['fetch']
  publicDirectory?: string
  siteURL?: string
  timeoutMs?: number
}

export interface GeneratedFeed {
  /** File name stem, for example `jordan-frankfurt-blog`. */
  name: string
  rss2: string
  atom1: string
  json1: string
}

const DEFAULT_SITE_URL = 'https://jordanfrankfurt.com'

const author = {
  name: 'Jordan Frankfurt',
  email: 'jordanwfrankfurt@gmail.com',
  link: 'https://twitter.com/JordanFrankfurt',
}

const audioMimeTypes: Record<string, string> = {
  aac: 'audio/aac',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  mp4: 'audio/mp4',
  oga: 'audio/ogg',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  wav: 'audio/wav',
}

const audioMimeType = (url: URL): string =>
  audioMimeTypes[url.pathname.split('.').pop()?.toLowerCase() ?? ''] ??
  'audio/mp4'

const encodeTitle = (s: string): string => s.toLowerCase().replace(/ /gi, '-')

const buildExcerpt = (html: string, max = 280): string => {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

function resolveSiteUrl(siteURL: string | undefined): string {
  const value = siteURL || process.env.SITE_URL || DEFAULT_SITE_URL
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`SITE_URL is not a valid URL: ${JSON.stringify(value)}`)
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`SITE_URL must use http or https: ${JSON.stringify(value)}`)
  }
  return value
}

export async function buildFeeds(
  posts: Post[],
  options: FeedBuildOptions = {}
): Promise<GeneratedFeed[]> {
  const siteURL = resolveSiteUrl(options.siteURL)
  const publicDirectory =
    options.publicDirectory ?? join(process.cwd(), 'public')
  const latestPostTime = Math.max(
    0,
    ...posts.map((p) => Date.parse(p.attributes.date))
  )
  const date = new Date(latestPostTime)

  const createFeed = (title: string) => {
    const name = encodeTitle(title)
    const feedUrl = (file: string) =>
      new URL(`rss/${name}-${file}`, siteURL).toString()
    return {
      name,
      feed: new Feed({
        author,
        copyright: `All rights reserved ${date.getUTCFullYear()}, Jordan Frankfurt`,
        description: 'mostly reading things',
        favicon: `${siteURL}/favicon.png`,
        generator: 'Feed for Node.js',
        title,
        id: siteURL,
        image: `${siteURL}/me.jpg`,
        language: 'en',
        link: siteURL,
        updated: date,
        feedLinks: {
          rss2: feedUrl('feed.xml'),
          json: feedUrl('feed.json'),
          atom: feedUrl('atom.xml'),
        },
      }),
    }
  }

  const baseTitle = 'Jordan Frankfurt'
  const audio = createFeed(`${baseTitle} podcast`)
  const text = createFeed(`${baseTitle} blog`)
  const video = createFeed(`${baseTitle} videos`)

  for (const post of posts) {
    const postUrl = new URL(post.slug, siteURL).toString()
    const item: Item = {
      author: [author],
      category: [{ name: 'Technology' }],
      content: post.html,
      contributor: [author],
      date: new Date(post.attributes.date),
      description: buildExcerpt(post.html),
      id: postUrl,
      link: postUrl,
      title: post.attributes.title,
    }

    if (post.attributes.audio) {
      const audioUrl = new URL(post.attributes.audio, siteURL)
      let length: number
      try {
        length = await getEnclosureLength(audioUrl, {
          fetch: options.fetch,
          timeoutMs: options.timeoutMs,
          publicDirectory,
          siteOrigin: new URL(siteURL).origin,
        })
      } catch (error) {
        throw new Error(
          `posts/${post.slug}.md: audio enclosure failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { cause: error }
        )
      }
      item.audio = {
        url: audioUrl.toString(),
        type: audioMimeType(audioUrl),
        length,
      }
      item.link = audioUrl.toString()
      audio.feed.addItem(item)
    } else if (post.attributes.video) {
      item.link = new URL(post.attributes.video, siteURL).toString()
      video.feed.addItem(item)
    } else {
      text.feed.addItem(item)
    }
  }

  return [audio, text, video].map(({ name, feed }) => ({
    name,
    rss2: feed.rss2(),
    atom1: feed.atom1(),
    json1: feed.json1(),
  }))
}

export function writeFeeds(feeds: GeneratedFeed[], outputDir: string): void {
  mkdirSync(outputDir, { recursive: true })
  for (const feed of feeds) {
    writeFileSync(join(outputDir, `${feed.name}-feed.xml`), feed.rss2)
    writeFileSync(join(outputDir, `${feed.name}-atom.xml`), feed.atom1)
    writeFileSync(join(outputDir, `${feed.name}-feed.json`), feed.json1)
  }
}

export async function runBuildJobs(
  options: FeedBuildOptions & {
    outputDir?: string
    postsDirectory?: string
  } = {}
): Promise<void> {
  const publicDirectory =
    options.publicDirectory ?? join(process.cwd(), 'public')
  const posts = await getBlogPostsData({
    postsDirectory: options.postsDirectory,
    publicDirectory,
  })
  const feeds = await buildFeeds(posts, { ...options, publicDirectory })
  writeFeeds(feeds, options.outputDir ?? join(publicDirectory, 'rss'))
}
