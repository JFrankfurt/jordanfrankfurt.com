import { FunctionComponent } from 'react'
import { theme } from 'styles/theme'
import Head from 'next/head'
import Link from 'next/link'
import { css, Global } from '@emotion/core'
import { FaTwitter, FaGithub } from 'react-icons/fa'

const GLOBAL_STYLES = css`
  img,
  picture,
  svg {
    max-height: ${theme.width.mobile};
    max-width: ${theme.width.mobile};
    @media screen and (min-width: ${theme.width.tablet}) {
      max-height: 600px;
      max-width: 600px;
    }
  }

  h1 {
    font-style: normal;
    text-transform: uppercase;
    font-size: 3.2em;
    margin: 1.2em 0 0 0;
    line-height: 70px;

    @media screen and (min-width: ${theme.width.mobile}) {
      font-size: 45px;
    }
  }

  h2 {
    border-bottom: 1px solid #ccc;
    font-family: TiemposText, Georgia, serif;
    font-size: 2em;
    margin: 1em 0 0.3em 0;
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2em;
    margin: 0.2em 0;
    padding: 0;
    padding-top: 0.5em;
  }

  article {
    margin-top: 1em;
  }

  main {
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    margin: 0 0.25em;
    max-width: 500px;
    width: 100%;
    @media screen and (min-width: ${theme.width.tablet}) {
      max-width: 650px;
    }
    @media screen and (min-width: ${theme.width.desktop}) {
      max-width: 800px;
    }
  }

  sub {
    color: ${theme.palette.grey60};
    display: block;
    font-style: italic;
    margin: 0 0 0.5em 0;
  }

  pre,
  table,
  ol,
  ul,
  dl,
  p {
    margin-top: 0;
    margin-bottom: 16px;
    word-spacing: 0.05em;
  }

  p {
    line-height: 1.55em;
  }

  table {
    border-collapse: collapse;
    margin: 0 auto;
    max-width: 500px;
    width: 100%;
  }

  td,
  th {
    border: 1px solid ${theme.palette.grey30};
    padding: 0.3em 0.5em;
    text-align: left;
  }
`

const rootCss = css`
  align-items: center;
  display: flex;
  font-family: sans-serif;
  font-size: 3.8vmin;
  flex-direction: column;
  justify-content: center;
  @media screen and (min-width: ${theme.width.mobile}) {
    font-size: 3.5vmin;
  }
  @media screen and (min-width: ${theme.width.tablet}) {
    font-size: 2.3vmin;
  }
  @media screen and (min-width: ${theme.width.desktopSmall}) {
    font-size: 2vmin;
  }
`
const navCss = css`
  align-items: center;
  display: flex;
  justify-content: center;
  margin-bottom: 2em;
  width: 100%;
  & > a {
    color: ${theme.palette.black};
    margin: 0 0.7em;
    & > svg {
      height: 1.5em;
      width: 1.5em;
    }
  }
`
const titleCss = css`
  & > a {
    text-decoration: none;
  }
`

interface props {
  description?: string
  title?: string
}
const defaultDescription = 'The blog and personal website of Jordan Frankfurt'
const baseTitle = '👺'
const Layout: FunctionComponent<props> = ({
  children,
  description = defaultDescription,
  title,
}) => (
  <>
    <Head>
      <title>Jordan Frankfurt</title>
      <meta name="theme-color" content={theme.palette.black} />
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />

      <meta
        property="og:title"
        content={`${baseTitle} ${title ? title : ''}`}
      />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:url" content="https://jordanfrankfurt.com" />
      <meta property="og:image" content="/me.jpg" />
      <meta property="og:image:height" content="2048" />
      <meta property="og:image:width" content="1597" />

      <meta
        property="twitter:title"
        content={`${baseTitle} ${title ? title : ''}`}
      />
      <meta property="twitter:image" content="/me.jpg" />
      <meta property="twitter:url" content="https://jordanfrankfurt.com" />
      <meta property="twitter:card" content="summary" />
      <meta property="twitter:description" content={description} />

      <link rel="shortcut icon" type="image/x-icon" href="/favicon.png" />
      <meta httpEquiv="Content-Type" content="text/html;charset=UTF-8" />
    </Head>
    <Global styles={GLOBAL_STYLES} />
    <div css={rootCss}>
      <h1 css={titleCss}>
        <Link href="/">
          <a>👺</a>
        </Link>
      </h1>
      <nav css={navCss}>
        <Link href="/about">
          <a>about</a>
        </Link>
        <a href="https://twitter.com/jordanfrankfurt">
          <FaTwitter />
        </a>
        <a href="https://github.com/jfrankfurt">
          <FaGithub />
        </a>
      </nav>
      {children}
    </div>
  </>
)

export default Layout
