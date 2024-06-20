import Head from 'next/head'
import Link from 'next/link'
import React, { FunctionComponent } from 'react'
import { FaGithub, FaTwitter } from 'react-icons/fa'

interface Props {
  description?: string
  title?: string
}
const defaultDescription = 'The blog and personal website of Jordan Frankfurt'
const baseTitle = '👺'

const Layout: FunctionComponent<Props> = ({
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
    <div className="flex flex-col items-center justify-center font-sans text-[3.8vmin] md:text-[3.5vmin] lg:text-[2.3vmin] xl:text-[2vmin]">
      <h1 className="my-12">
        <Link href="/" className="no-underline">
          👺
        </Link>
      </h1>
      <nav className="flex items-center justify-center mb-8 w-full">
        <Link href="/about" className="mx-3 ext-black">
          about
        </Link>
        <Link
          href="https://twitter.com/jordanfrankfurt"
          className="mx-3 text-black"
        >
          <FaTwitter className="h-6 w-6" />
        </Link>
        <Link href="https://github.com/jfrankfurt" className="mx-3 text-black">
          <FaGithub className="h-6 w-6" />
        </Link>
      </nav>
      <main className="flex flex-col items-start justify-start w-full max-w-[500px] sm:max-w-[600px] md:max-w-[650px] lg:max-w-[800px] mx-1 md:mx-auto">
        {children}
      </main>
    </div>
  </>
)

export default Layout
