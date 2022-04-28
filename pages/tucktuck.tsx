import { css, keyframes } from '@emotion/core'
import Layout from 'components/Layout'
import React, { useEffect, useState } from 'react'
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
const titleCss = css`
  color: black;
  text-decoration: none;
  margin-bottom: 0;
  font-size: 1.3em;
  line-height: 1.3em;
  &:hover {
    text-decoration: underline;
  }
`
const errorCss = css`
  color: red;
`

const controlsCss = css`
  margin-top: 1em;
  text-align: center;
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

interface TuckerData {
  list: string[]
  url: string
  title: string
  timeAgo: string
}
interface TuckerState {
  data: TuckerData | null
  error: string
  loading: boolean
}

function useEndpoint(endpoint: string): TuckerState {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<TuckerData | null>(null)
  useEffect(() => {
    setLoading(true)
    setError('')
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
  const baseEndpoint = '/api/scrape-tucker'
  const [offset, setOffset] = useState('0')
  const { data, error, loading } = useEndpoint(
    `${baseEndpoint}${offset ? `?offset=${offset}` : ''}`
  )

  const handleOffsetChange = ({
    target: { value },
  }: {
    target: { value: string }
  }) => {
    if (value === undefined || value === '') {
      return setOffset('0')
    }
    if (Number.isNaN(parseInt(value))) {
      return setOffset('0')
    }
    if (parseInt(value) > 10) {
      return setOffset('0')
    }
    return setOffset(value)
  }

  function decrement() {
    const cur = parseInt(offset)
    const newOffset = cur - 1
    if (newOffset >= 0 && newOffset <= 10) {
      setOffset(newOffset.toString())
    }
  }

  function increment() {
    const cur = parseInt(offset)
    const newOffset = cur + 1
    if (newOffset >= 0 && newOffset <= 10) {
      setOffset(newOffset.toString())
    }
  }

  return (
    <Layout>
      <div css={rootCss}>
        <a
          href="https://www.foxnews.com/category/shows/tucker-carlson-tonight/transcript"
          target="_blank"
          rel="noopener noreferrer">
          <Image
            css={imageCss}
            src="/tucker.jpg"
            alt="the man himself"
            width="400px"
            height="225px"
          />
        </a>
        <div css={controlsCss}>
          days ago: &nbsp; {offset}
          <div>
            <button onClick={decrement}>➖</button>
            &nbsp;
            <button onClick={increment}>➕</button>
          </div>
          {offset === '10' && (
            <div>
              <code>cant go more than 10 days back</code>
            </div>
          )}
        </div>
        {data && (
          <h1 css={titleCss}>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              css={titleCss}>
              {data.title}
            </a>
          </h1>
        )}
        {data && <div>{data.timeAgo}</div>}
        {loading && 'loading...'}
        {error && <code css={errorCss}>{error}</code>}
        <div css={dataWrapperCss}>
          {Boolean(!loading && !error && data && data.list.length) ? (
            <>
              <strong>Speakers:</strong>
              {data?.list.map((entry) => (
                <div css={dataEntryCss} key={entry}>
                  {entry}
                </div>
              ))}
            </>
          ) : (
            <strong>no other speakers in this transcript</strong>
          )}
        </div>
      </div>
    </Layout>
  )
}
