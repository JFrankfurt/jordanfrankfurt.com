import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import Layout from 'components/Layout'
import { DateTime } from 'luxon'
import { getPostBySlug, getPostSlugs, Post } from 'utils/blog'
import styles from '../styles/article.module.css'

type Props = Pick<Post, 'attributes' | 'html'>

const PostPage: NextPage<Props> = ({ attributes, html }) => {
  if (!html) return <div>not found</div>

  const DT = DateTime.fromISO(attributes.date)
  return (
    <Layout title={attributes.title}>
      <main className="mx-2">
        <h1 className={styles.title}>{attributes.title}</h1>
        <sub>{DT.toLocaleString(DateTime.DATE_MED)}</sub>
        <article
          dangerouslySetInnerHTML={{ __html: html }}
          className={styles.article}
        />
      </main>
    </Layout>
  )
}

export default PostPage

export const getStaticProps: GetStaticProps<Props, { slug: string }> = async ({
  params,
}) => {
  if (!params) throw new Error('Missing route params')
  const { attributes, html } = await getPostBySlug(params.slug)
  return { props: { attributes, html } }
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getPostSlugs().map((slug) => ({ params: { slug } })),
  fallback: false,
})
