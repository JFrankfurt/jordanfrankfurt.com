import Layout from 'components/Layout'
import { DateTime } from 'luxon'
import { GetStaticPaths, GetStaticProps, NextPage } from 'next'

interface props {
  html: string
  attributes: Record<string, any>
}

const Post: NextPage<props> = ({ attributes, html }) => {
  if (!html) return <div>not found</div>

  const DT = DateTime.fromISO(attributes.date)
  return (
    <Layout>
      <main>
        <h1>{attributes.title}</h1>
        <sub>{DT.toLocaleString(DateTime.DATE_MED)}</sub>
        <article dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </Layout>
  )
}

export default Post

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params as { slug: string }
  const post = await import(`posts/${slug}.md`).catch(console.error)
  console.log(post, slug)
  return { props: { ...post.default } }
}

export const getStaticPaths: GetStaticPaths = async () => {
  // https://webpack.js.org/guides/dependency-management/#requirecontext
  const markdownFiles = require
    // @ts-ignore
    .context('posts', false, /\.md$/)
    .keys()
    .map((relativePath: string) => relativePath.substring(2))

  const posts = await Promise.all(
    markdownFiles.map(async (path: string) => {
      const markdown = await import(`posts/${path}`)
      return { ...markdown, slug: path.substring(0, path.length - 3) } // remove ".md" from path
    })
  )
  // @ts-ignore
  const paths = posts.map(({ slug }) => ({ params: { slug } }))
  return {
    paths,
    fallback: false,
  }
}
