import { FunctionComponent } from 'react'
import { theme } from 'styles/theme'
import Head from 'next/head'
import Link from 'next/link'
import { css } from '@emotion/core'

const rootCss = css`
  align-items: center;
  display: flex;
  font-family: sans-serif;
  flex-direction: column;
  justify-content: center;
`
const navCss = css`
  margin-bottom: 2em;
  & > a {
    margin: 0 1em;
  }
`
const titleCss = css`
  & > a {
    text-decoration: none;
  }
`

const Layout: FunctionComponent = ({ children }) => (
  <>
    <Head>
      <title>Jordan Frankfurt</title>
      <meta name="theme-color" content={theme.palette.black} />
      <meta name="description" content="" />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content="" />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:url" content="https://jordanfrankfurt.com" />

      {/* <meta property="og:image" content="/home.jpg" />
      <link rel="shortcut icon" type="image/x-icon" href="/favicon.png" /> */}

      <meta httpEquiv="Content-Type" content="text/html;charset=UTF-8" />
    </Head>
    <div css={rootCss}>
      <h1 css={titleCss}>
        <Link href="/">
          <a>👹🏡👺</a>
        </Link>
      </h1>
      <nav css={navCss}>
        <Link href="about">
          <a>about</a>
        </Link>
        <Link href="newsletter">
          <a>newsletter</a>
        </Link>
      </nav>
      {children}
    </div>
  </>
)

export default Layout
