import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { imageSize } from 'image-size'
import { remark } from 'remark'
import html from 'remark-html'

export interface Post {
  attributes: {
    audio?: string
    date: string
    title: string
    video?: string
  }
  html: string
  slug: string
}

const imgTagRe = /<img\s+([^>]*?)\/?\s*>/g
const srcRe = /src="([^"]+)"/

function addImageDimensions(contentHtml: string): string {
  const publicDir = path.join(process.cwd(), 'public')
  return contentHtml.replace(imgTagRe, (match) => {
    const srcMatch = match.match(srcRe)
    if (!srcMatch) return match

    const src = srcMatch[1]
    const filePath = path.join(publicDir, src)
    if (!fs.existsSync(filePath)) return match

    try {
      const buf = fs.readFileSync(filePath)
      const dimensions = imageSize(buf)
      if (!dimensions.width || !dimensions.height) return match
      return match.replace(
        /\/?\s*>$/,
        ` width="${dimensions.width}" height="${dimensions.height}">`
      )
    } catch {
      return match
    }
  })
}

export async function getBlogPostsData(): Promise<Post[]> {
  const postsDirectory = path.join(process.cwd(), 'posts')
  const filenames = fs.readdirSync(postsDirectory)

  const posts = await Promise.all(
    filenames
      .filter((filename) => filename.endsWith('.md'))
      .map(async (filename) => {
        const filePath = path.join(postsDirectory, filename)
        const fileContents = fs.readFileSync(filePath, 'utf8')
        const { data, content } = matter(fileContents)

        const processedContent = await remark().use(html).process(content)
        const contentHtml = addImageDimensions(processedContent.toString())

        const slug = filename.replace(/\.md$/, '')

        return {
          attributes: data,
          html: contentHtml,
          slug,
        } as Post
      })
  )

  return posts
}
