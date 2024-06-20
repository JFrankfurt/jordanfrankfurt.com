import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import Layout from 'components/Layout'
import { DateTime } from 'luxon'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import styles from '../styles/article.module.css'

interface Props {
  html: string
  attributes: Record<string, any>
}

const Post: NextPage<Props> = ({ attributes, html }) => {
  if (!html) return <div>not found</div>

  const DT = DateTime.fromISO(attributes.date as string)
  return (
    <Layout title={attributes.title}>
      <main>
        <h1 className={styles.title}>{attributes.title}</h1>
        <sub>{DT.toLocaleString(DateTime.DATE_MED)}</sub>
        <article dangerouslySetInnerHTML={{ __html: html }} className={styles.article} />
      </main>
    </Layout>
  )
}

export default Post

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params as { slug: string }
  const filePath = path.join(process.cwd(), 'posts', `${slug}.md`)
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)

  const processedContent = await remark().use(html).process(content)
  const contentHtml = processedContent.toString()

  const attributes = {
    ...data,
    date: data.date ? new Date(data.date).toISOString() : null,
  }

  return { props: { attributes, html: contentHtml } }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const postsDirectory = path.join(process.cwd(), 'posts')
  const filenames = fs.readdirSync(postsDirectory)

  const paths = filenames
    .filter((filename) => filename.endsWith('.md'))
    .map((filename) => {
      const slug = filename.replace(/\.md$/, '')
      return { params: { slug } }
    })

  return {
    paths,
    fallback: false,
  }
}
