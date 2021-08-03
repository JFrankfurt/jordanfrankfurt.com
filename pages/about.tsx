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
        <h1>About Jordan Frankfurt</h1>
        <p>
          I'm a software engineer. I started writing code around 2014. A big
          thanks to&nbsp;
          <a
            href="https://twitter.com/pearoftheweek"
            target="_blank"
            rel="noopener noreferrer">
            Trevor
          </a>
          &nbsp;for making that happen.
        </p>
        <p>
          I'm married to&nbsp;
          <a
            href="https://laurenfrankfurtyoga.com"
            target="_blank"
            rel="noopener noreferrer">
            Lauren
          </a>
          . I fight people (
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
