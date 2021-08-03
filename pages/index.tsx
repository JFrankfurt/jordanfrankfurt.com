import { css } from '@emotion/core'
import Layout from 'components/Layout'
import { DateTime } from 'luxon'
import { NextPage } from 'next'
import Link from 'next/link'
import React from 'react'
import { theme } from 'styles/theme'
import { runBuildJobs } from 'utils'
import { getBlogPostsData, Post } from 'utils/blog'

const rootCss = css``
const titleLink = css`
  text-decoration: none;
`
const postTitleCss = css`
  color: ${theme.palette.black};
  transition: color 200ms ease;
  &:hover {
    color: ${theme.palette.linkHoverRed};
  }
`

interface props {
  posts: Post[]
}

const Index: NextPage<props> = ({ posts }) => (
  <Layout>
    <main css={rootCss}>
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
                <a key={slug} css={titleLink}>
                  <h1 css={postTitleCss}>{attributes.title}</h1>
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
