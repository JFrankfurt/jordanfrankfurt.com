import { css } from '@emotion/core'
import Layout from 'components/Layout'

const rootCss = css`
  min-width: 360px;
  width: 45vw;
`

export default function About() {
  return (
    <Layout>
      <div css={rootCss}>
        <h1>About me</h1>
        <p>
          I fight people (
          <a
            href="https://www.youtube.com/watch?v=4qdaVwwz1bw"
            target="_blank"
            rel="noopener noreferrer">
            poorly
          </a>
          ) as often as I can.
        </p>
      </div>
    </Layout>
  )
}
