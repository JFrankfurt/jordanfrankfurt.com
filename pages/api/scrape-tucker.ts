import { NextApiRequest, NextApiResponse } from 'next'
import Nightmare from 'nightmare'

const nightmare = new Nightmare({ show: false })

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await nightmare
      .goto(
        'https://www.foxnews.com/category/shows/tucker-carlson-tonight/transcript'
      )
      .click(
        'div.content:nth-child(1) > article:nth-child(1) > div:nth-child(2) > header:nth-child(1) > h4:nth-child(2) > a:nth-child(1)'
      )
      .wait('.article-body > p > i > strong')
      .evaluate(() =>
        Array.from(
          new Set(
            (
              Array.from(
                document.querySelectorAll('.article-body > p > i > strong')
              ) as HTMLSpanElement[]
            )
              .map((string) => string.innerText.trim())
              .map((trimmedString) => {
                if (trimmedString[trimmedString.length - 1] === ':') {
                  return trimmedString.substring(0, trimmedString.length - 1)
                }
                return trimmedString
              })
              .filter((string) => {
                // add entries you don't care about here
                return !['TUCKER CARLSON ORIGINALS', 'REPORTER'].includes(
                  string
                )
              })
          )
        )
      )
      .end()
      .then((data) => res.status(200).json(data))
  } catch (e: any) {
    console.error(e)
    console.error('error')
    res.status(400).send(e.toString())
  }
}
