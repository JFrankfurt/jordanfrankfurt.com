import Layout from 'components/Layout'
import { DateTime } from 'luxon'
import { NextPage } from 'next'
import Link from 'next/link'
import { runBuildJobs } from 'utils'
import { getBlogPostsData, Post } from 'utils/blog'

interface props {
  posts: Post[]
}

const Index: NextPage<props> = ({ posts }) => (
  <Layout>
    <main>
      {posts
        .sort((a, b) => {
          const dateA = DateTime.fromISO(a.attributes.date)
          const dateB = DateTime.fromISO(b.attributes.date)
          return dateA < dateB ? 1 : -1
        })
        .map(({ attributes, html, slug }) => {
          if (!html) return <div>not found</div>
          const DT = DateTime.fromISO(attributes.date)
          return (
            <div key={`post-list-${slug}`}>
              <Link href={slug} passHref>
                <a key={slug} className="no-underline">
                  <h1 className="transition-colors text-black hover:text-linkHoverRed">
                    {attributes.title}
                  </h1>
                </a>
              </Link>
              <sub>{DT.toLocaleString(DateTime.DATE_MED)}</sub>
              <article dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          )
        })}
    </main>
  </Layout>
)

export default Index

export const getStaticProps = async () => {
  let posts = await getBlogPostsData()
  await runBuildJobs()
  return { props: { posts } }
}
