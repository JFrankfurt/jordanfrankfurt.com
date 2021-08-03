import { css } from '@emotion/core'
import Layout from 'components/Layout'
import { DateTime } from 'luxon'
import { NextPage } from 'next'
import Link from 'next/link'
import React from 'react'
import { theme } from 'styles/theme'

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
const importPosts = async (): Promise<Post[]> => {
  // https://webpack.js.org/guides/dependency-management/#requirecontext
  const markdownFiles = require
    // @ts-ignore
    .context('posts', false, /\.md$/)
    .keys()
    .filter((path: string) => path.substring(0, 1) !== '.')

  return Promise.all(
    markdownFiles.map(async (path: string) => {
      const markdown = await import(`../${path}`)
      // .substring removes ".md" from path
      let slug = path.substring(0, path.length - 3)
      // .slice removes posts prefix
      slug = slug.slice('posts'.length)
      return { ...markdown, slug }
    })
  )
}

interface Post {
  attributes: Record<string, any>
  html: string
  slug: string
}

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
  let posts = await importPosts()
  return { props: { posts } }
}
