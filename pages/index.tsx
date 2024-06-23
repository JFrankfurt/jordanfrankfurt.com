import Layout from 'components/Layout'
import { DateTime } from 'luxon'
import { NextPage } from 'next'
import Link from 'next/link'
import { runBuildJobs } from 'utils'
import { getBlogPostsData, Post } from 'utils/blog'
import styles from '../styles/article.module.css'

interface Props {
  posts: Post[]
}

const Index: NextPage<Props> = ({ posts }) => (
  <Layout>
    <main>
      {posts
        .sort((a, b) => {
          const dateA = DateTime.fromISO(a.attributes.date as string)
          const dateB = DateTime.fromISO(b.attributes.date as string)
          return dateA < dateB ? 1 : -1
        })
        .map(({ attributes, html, slug }) => {
          if (!html) return <div key={slug}>not found</div>
          const DT = DateTime.fromISO(attributes.date as string)
          return (
            <div key={`post-list-${slug}`} className="mx-2">
              <h1 className={styles.title}>
                <Link
                  href={slug}
                  className="no-underline transition-colors text-black hover:text-linkHoverRed">
                  {attributes.title}
                </Link>
              </h1>
              <sub>{DT.toLocaleString(DateTime.DATE_MED)}</sub>
              <article
                dangerouslySetInnerHTML={{ __html: html }}
                className={styles.article}
              />
            </div>
          )
        })}
    </main>
  </Layout>
)

export default Index

export const getStaticProps = async () => {
  await runBuildJobs()
  let posts = (await getBlogPostsData()).map((post) => ({
    ...post,
    attributes: {
      ...post.attributes,
      date: post.attributes.date
        ? new Date(post.attributes.date).toISOString()
        : null,
    },
  }))

  return { props: { posts } }
}
