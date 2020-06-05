import { css } from '@emotion/core'
import Layout from 'components/Layout'
import { theme } from 'styles/theme'

const rootCss = css`
  display: flex;
  flex-direction: column;

  @media screen and (min-width: ${theme.width.tablet}) {
    flex-direction: row;
  }
`

const sectionCss = css`
  margin: 1em;
`

const titleCss = css`
  margin: 0 auto;
`

export default () => (
  <Layout>
    <div css={rootCss}>
      <section css={sectionCss}>
        <h1 css={titleCss}>About this blog</h1>
      </section>
      <section css={sectionCss}>
        <h1 css={titleCss}>About me</h1>
      </section>
    </div>
  </Layout>
)
