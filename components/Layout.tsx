import Head from 'next/head'
import Link from 'next/link'
import React, { FunctionComponent, PropsWithChildren } from 'react'
import { FaGithub, FaTwitter } from 'react-icons/fa'
import RunningStats from './RunningStats'

interface LayoutProps {
  description?: string
  title?: string
}
const defaultDescription = 'The blog and personal website of Jordan Frankfurt'
const baseTitle = '👺'

const Layout: FunctionComponent<PropsWithChildren<LayoutProps>> = ({
  children,
  description = defaultDescription,
  title,
}) => (
  <>
    <Head>
      <title>Jordan Frankfurt</title>
      <meta name="theme-color" content="#000000" />
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
    <div className="flex flex-col items-center justify-center font-sans text-sm lg:text-base">
      <header className="mx-auto w-full max-w-[500px] sm:max-w-[600px] md:max-w-[650px] lg:max-w-[800px]">
        <nav className="flex w-full flex-row flex-wrap items-center gap-x-4 gap-y-2 px-2 py-3">
          <h1 className="m-0 text-2xl leading-none">
            <Link href="/" className="no-underline" aria-label="Home">
              👺
            </Link>
          </h1>
          <Link href="/about" className="text-black">
            about
          </Link>
          <Link href="/goals" className="text-black">
            goals
          </Link>
          <Link
            href="https://twitter.com/jordanfrankfurt"
            className="ml-auto text-black"
            aria-label="Twitter"
          >
            <FaTwitter className="h-5 w-5" />
          </Link>
          <Link
            href="https://github.com/jfrankfurt"
            className="text-black"
            aria-label="GitHub"
          >
            <FaGithub className="h-5 w-5" />
          </Link>
        </nav>
        <RunningStats />
      </header>
      <main className="mx-1 flex w-full max-w-[500px] flex-col items-center justify-start px-2 pt-3 sm:max-w-[600px] md:mx-auto md:max-w-[650px] lg:max-w-[800px]">
        {children}
      </main>
    </div>
  </>
)

export default Layout
