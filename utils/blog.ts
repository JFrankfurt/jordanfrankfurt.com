import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
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
        const contentHtml = processedContent.toString()

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
