import Layout from 'components/Layout'
import { DateTime } from 'luxon'
import { GetStaticProps, NextPage } from 'next'
import Link from 'next/link'
import { runBuildJobs } from 'utils'
import { getBlogPostsData, Post, sortPostsNewestFirst } from 'utils/blog'
import styles from '../styles/article.module.css'

interface Props {
  posts: Post[]
}

const Index: NextPage<Props> = ({ posts }) => (
  <Layout>
    <>
      {posts.map(({ attributes, html, slug }) => {
        if (!html) return <div key={slug}>not found</div>
        const DT = DateTime.fromISO(attributes.date)
        return (
          <div key={`post-list-${slug}`}>
            <h1 className={styles.title}>
              <Link
                href={slug}
                className="hover:text-linkHoverRed text-black no-underline transition-colors"
              >
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
    </>
  </Layout>
)

export default Index

export const getStaticProps: GetStaticProps<Props> = async () => {
  await runBuildJobs()
  const posts = sortPostsNewestFirst(await getBlogPostsData())
  return { props: { posts } }
}
