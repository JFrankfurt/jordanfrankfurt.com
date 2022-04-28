import { NextApiRequest, NextApiResponse } from 'next'
import jsdom from 'jsdom'

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const headers = new Headers({
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.5',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    Cookie: '',
    DNT: '1',
    Host: 'www.foxnews.com',
    Pragma: 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-GPC': '1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:100.0) Gecko/20100101 Firefox/100.0',
  })
  const transcriptLink =
    'https://www.foxnews.com/category/shows/tucker-carlson-tonight/transcript'
  try {
    const response = await fetch(transcriptLink, { headers })
    if (!response.ok) {
      return res.status(response.status).send('transcript index fetch failed')
    }
    const indexText = await response.text()
    const indexDOM = new jsdom.JSDOM(indexText)
    const linkToMostRecent = indexDOM.window.document.querySelector(
      'h4.title > a'
    ) as HTMLAnchorElement | null
    if (!linkToMostRecent) {
      return res.status(400).send('unable to find link to first article')
    }

    const mostRecentResponse = await fetch(
      `https://www.foxnews.com/${linkToMostRecent.href}`,
      { headers }
    )
    if (!mostRecentResponse.ok) {
      return res.status(response.status).send('unable to load article')
    }
    const mostRecentText = await mostRecentResponse.text()
    const mostRecentDOM = new jsdom.JSDOM(mostRecentText)
    const queriedNodes = [
      ...Array.from(
        mostRecentDOM.window.document.querySelectorAll('p > strong')
      ),
      ...Array.from(
        mostRecentDOM.window.document.querySelectorAll('p > i > strong')
      ),
    ] as HTMLSpanElement[]
    if (queriedNodes.length === 0) {
      res.status(200).send('no entries found--double check for yourself')
    }

    const data = Array.from(
      new Set(
        queriedNodes
          .map((string) => string.innerHTML?.trim() ?? '')
          .filter((string) => Boolean(string))
          .map((trimmedString) => {
            if (trimmedString[trimmedString.length - 1] === ':') {
              return trimmedString.substring(0, trimmedString.length - 1)
            }
            return trimmedString
          })
          .filter((string) => {
            // add entries you don't care about here
            return !['TUCKER CARLSON ORIGINALS', 'REPORTER'].includes(string)
          })
      )
    )
    res.status(200).json(data)
  } catch (e) {
    console.error(e)
    return res.status(400).send('something went wrong!')
  }
}

export default handler
