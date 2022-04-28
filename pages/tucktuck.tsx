import { css, keyframes } from '@emotion/core'
import Layout from 'components/Layout'
import { useEffect, useState } from 'react'
import Image from 'next/image'

const rootCss = css`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 360px;
  width: 45vw;
`

const dataWrapperCss = css`
  margin-top: 1em;
  text-align: center;
`
const dataEntryCss = css``

const errorCss = css`
  color: red;
`

const pulseAnim = keyframes`
  from {
    transform: scale(0.95);
  }
  to {
    transform: scale(1);
  }
`

const imageCss = css`
  animation: ${pulseAnim} 2000ms infinite alternate;
  border-radius: 1em;
`

function useEndpoint(endpoint: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<string[] | null>(null)
  useEffect(() => {
    setLoading(true)
    fetch(endpoint)
      .then(async (res) => {
        if (res.ok) {
          setData(await res.json())
        }
      })
      .catch((e) => setError(e.toString() || 'something went wrong'))
      .finally(() => setLoading(false))
  }, [endpoint])
  return { data, error, loading }
}

export default function TuckTuck() {
  const { data, error, loading } = useEndpoint('/api/scrape-tucker')
  const now = new Date()
  return (
    <Layout>
      <div css={rootCss}>
        <Image
          css={imageCss}
          src="/tucker.jpg"
          alt="the man himself"
          width="400px"
          height="225px"
        />
        <div>{now.toLocaleDateString()}</div>
        {loading && 'loading...'}
        {error && <code css={errorCss}>{error}</code>}
        <div css={dataWrapperCss}>
          {data &&
            data.map((entry) => (
              <div css={dataEntryCss} key={entry}>
                {entry}
              </div>
            ))}
        </div>
      </div>
    </Layout>
  )
}
