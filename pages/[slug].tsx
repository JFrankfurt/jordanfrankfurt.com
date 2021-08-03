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
    <Layout title={attributes.title}>
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
  return { props: { ...post.default } }
}

export const getStaticPaths: GetStaticPaths = async () => {
  // https://webpack.js.org/guides/dependency-management/#requirecontext
  const markdownFiles = require
    // @ts-ignore
    .context('posts', false, /\.md$/)
    .keys()
    .filter((path: string) => path.substring(0, 1) !== '.')

  const posts = (await Promise.all(
    markdownFiles.map(async (path: string) => {
      const markdown = await import(`../${path}`)
      // .substring removes ".md" from path
      let slug = path.substring(0, path.length - 3)
      // .slice removes posts prefix
      slug = slug.slice('posts/'.length)
      return { ...markdown, slug }
    })
  )) as { html: string; slug: string }[]
  const paths = posts.map(({ slug }) => ({ params: { slug } }))
  return {
    paths,
    fallback: false,
  }
}
