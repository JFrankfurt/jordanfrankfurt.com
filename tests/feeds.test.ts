import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildFeeds, GeneratedFeed, runBuildJobs, writeFeeds } from '../utils'
import { getBlogPostsData, Post } from '../utils/blog'

const fixtures = path.join(import.meta.dirname, 'fixtures/blog')
const paths = {
  postsDirectory: path.join(fixtures, 'posts'),
  publicDirectory: path.join(fixtures, 'public'),
}
const siteURL = 'https://example.test'

const headFetch = (size: number) =>
  vi.fn(
    async () =>
      new Response(null, { headers: { 'content-length': String(size) } })
  )

const build = async (options: Parameters<typeof buildFeeds>[1] = {}) => {
  const posts = await getBlogPostsData(paths)
  return buildFeeds(posts, {
    siteURL,
    publicDirectory: paths.publicDirectory,
    fetch: headFetch(4321),
    ...options,
  })
}

const byName = (feeds: GeneratedFeed[]) =>
  Object.fromEntries(feeds.map((f) => [f.name, f]))

const enclosures = (xml: string) =>
  (xml.match(/<enclosure [^>]*\/>/g) ?? []).map((tag) =>
    Object.fromEntries(
      [...tag.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]])
    )
  )

const items = (xml: string) => xml.match(/<item>[\s\S]*?<\/item>/g) ?? []

/** Removes CDATA sections, then checks the remaining XML text is well formed. */
function assertWellFormed(xml: string) {
  const outside = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
  expect(outside).not.toContain('<![CDATA[')
  expect(outside).not.toContain(']]>')
  expect(
    outside.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);/gi, '')
  ).not.toMatch(/&/)
  expect(xml).not.toMatch(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/)
}

describe('feed generation', () => {
  it('produces the same three feeds and public file names', async () => {
    const feeds = await build()
    expect(feeds.map((f) => f.name)).toEqual([
      'jordan-frankfurt-podcast',
      'jordan-frankfurt-blog',
      'jordan-frankfurt-videos',
    ])
    const dir = mkdtempSync(path.join(tmpdir(), 'feeds-'))
    try {
      writeFeeds(feeds, dir)
      expect(readdirSync(dir).sort()).toEqual(
        feeds
          .flatMap((f) => [
            `${f.name}-atom.xml`,
            `${f.name}-feed.json`,
            `${f.name}-feed.xml`,
          ])
          .sort()
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('routes posts to the audio, video and text feeds', async () => {
    const feeds = byName(await build())
    const titles = (name: string) =>
      JSON.parse(feeds[name].json1).items.map((i: { title: string }) => i.title)
    expect(titles('jordan-frankfurt-podcast')).toEqual([
      'Local episode',
      'Remote episode',
    ])
    expect(titles('jordan-frankfurt-videos')).toEqual(['Watch this'])
    expect(titles('jordan-frankfurt-blog')).toEqual([
      'Plain post & "quotes" <tag> ]]> done',
      'With image',
    ])
  })

  it('writes consistent RSS 2.0 channel and item data', async () => {
    const { 'jordan-frankfurt-blog': blog } = byName(await build())
    expect(blog.rss2).toMatch(
      /^<\?xml version="1\.0" encoding="utf-8"\?>\n<rss version="2\.0"/
    )
    expect(blog.rss2).toContain('<title>Jordan Frankfurt blog</title>')
    expect(blog.rss2).toContain('<link>https://example.test/</link>')
    expect(blog.rss2).toContain(
      '<description>mostly reading things</description>'
    )
    expect(blog.rss2).toContain(
      '<lastBuildDate>Thu, 04 Jul 2024 08:30:00 GMT</lastBuildDate>'
    )
    expect(blog.rss2).toContain('<language>en</language>')
    expect(blog.rss2).toContain('<url>https://example.test/me.jpg</url>')
    expect(blog.rss2).toContain(
      '<copyright>All rights reserved 2024, Jordan Frankfurt</copyright>'
    )
    expect(blog.rss2).toContain('<generator>Feed for Node.js</generator>')
    const [plain, image] = items(blog.rss2)
    expect(plain).toContain(
      '<guid isPermaLink="false">https://example.test/plain</guid>'
    )
    expect(plain).toContain('<link>https://example.test/plain</link>')
    expect(plain).toContain('<pubDate>Fri, 01 Mar 2024 17:00:00 GMT</pubDate>')
    expect(plain).toContain('<category>Technology</category>')
    expect(image).toContain('width="3" height="2"')
    assertWellFormed(blog.rss2)
  })

  it('writes consistent Atom data', async () => {
    const { 'jordan-frankfurt-blog': blog } = byName(await build())
    expect(blog.atom1).toContain('<feed xmlns="http://www.w3.org/2005/Atom"')
    expect(blog.atom1).toContain('<id>https://example.test</id>')
    expect(blog.atom1).toContain('<title>Jordan Frankfurt blog</title>')
    expect(blog.atom1).toContain(
      'href="https://example.test/rss/jordan-frankfurt-blog-atom.xml"'
    )
    expect(blog.atom1).toContain('<updated>2024-07-04T08:30:00.000Z</updated>')
    expect(blog.atom1).toContain('<id>https://example.test/plain</id>')
    expect(blog.atom1).toContain('href="https://example.test/plain"')
    assertWellFormed(blog.atom1)
  })

  it('writes consistent JSON Feed data', async () => {
    const { 'jordan-frankfurt-blog': blog } = byName(await build())
    const json = JSON.parse(blog.json1)
    expect(json.version).toBe('https://jsonfeed.org/version/1')
    expect(json.title).toBe('Jordan Frankfurt blog')
    expect(json.home_page_url).toBe('https://example.test')
    expect(json.feed_url).toBe(
      'https://example.test/rss/jordan-frankfurt-blog-feed.json'
    )
    expect(json.items[0]).toMatchObject({
      id: 'https://example.test/plain',
      url: 'https://example.test/plain',
      date_modified: '2024-03-01T17:00:00.000Z',
    })
    expect(json.items[0].content_html).toContain('<strong>world</strong>')
  })

  it('escapes markup in titles and content in every format', async () => {
    const { 'jordan-frankfurt-blog': blog } = byName(await build())
    expect(blog.rss2).toContain(']]]]><![CDATA[>')
    expect(blog.atom1).toContain(']]]]><![CDATA[>')
    for (const xml of [blog.rss2, blog.atom1]) {
      expect(xml).not.toContain('<script')
      expect(xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')).not.toContain(
        '<tag>'
      )
      assertWellFormed(xml)
    }
    expect(JSON.parse(blog.json1).items[0].title).toBe(
      'Plain post & "quotes" <tag> ]]> done'
    )
  })

  it('is deterministic', async () => {
    expect(await build()).toEqual(await build())
  })

  it('uses SITE_URL when no site URL is given and rejects bad values', async () => {
    vi.stubEnv('SITE_URL', 'https://env.example.test')
    const feeds = byName(await build({ siteURL: undefined }))
    expect(feeds['jordan-frankfurt-blog'].rss2).toContain(
      'https://env.example.test/plain'
    )
    vi.stubEnv('SITE_URL', 'ftp://env.example.test')
    await expect(build({ siteURL: undefined })).rejects.toThrow(
      'SITE_URL must use http or https'
    )
    vi.stubEnv('SITE_URL', 'not a url')
    await expect(build({ siteURL: undefined })).rejects.toThrow(
      'SITE_URL is not a valid URL'
    )
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })
})

describe('audio enclosures', () => {
  const podcast = async (options?: Parameters<typeof buildFeeds>[1]) =>
    byName(await build(options))['jordan-frankfurt-podcast']

  it('uses the local file size for audio on the site origin', async () => {
    const fetch = headFetch(1)
    const feed = await podcast({ fetch })
    expect(enclosures(feed.rss2)[0]).toEqual({
      url: 'https://example.test/audio/local-episode.m4a',
      length: '1234',
      type: 'audio/mp4',
    })
    expect(fetch).not.toHaveBeenCalledWith(
      'https://example.test/audio/local-episode.m4a',
      expect.anything()
    )
  })

  it('uses the Content-Length header for remote audio without downloading it', async () => {
    const fetch = headFetch(98765)
    const feed = await podcast({ fetch })
    expect(enclosures(feed.rss2)[1]).toEqual({
      url: 'https://cdn.example.test/audio/remote.m4a',
      length: '98765',
      type: 'audio/mp4',
    })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      'https://cdn.example.test/audio/remote.m4a',
      expect.objectContaining({ method: 'HEAD' })
    )
    expect(JSON.parse(feed.json1).items[0].url).toBe(
      'https://example.test/audio/local-episode.m4a'
    )
  })

  it('names the post when the audio request fails', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 404 }))
    await expect(podcast({ fetch })).rejects.toThrow(
      /posts\/episode-remote\.md: audio enclosure failed: .*HEAD returned HTTP 404/
    )
  })

  it('picks the MIME type from the file extension', async () => {
    const posts: Post[] = [
      {
        slug: 'ep',
        html: '<p>x</p>',
        attributes: {
          title: 'Ep',
          date: '2024-01-01T00:00:00.000Z',
          audio: 'https://cdn.example.test/a/ep.MP3?x=1',
        },
      },
    ]
    const [podcastFeed] = await buildFeeds(posts, {
      siteURL,
      fetch: headFetch(5),
    })
    expect(enclosures(podcastFeed.rss2)).toEqual([
      expect.objectContaining({ type: 'audio/mpeg', length: '5' }),
    ])
  })

  it('does not publish an enclosure for video links', async () => {
    const feeds = byName(await build())
    expect(enclosures(feeds['jordan-frankfurt-videos'].rss2)).toEqual([])
    expect(feeds['jordan-frankfurt-videos'].rss2).toContain(
      '<link>https://video.example.test/watch.mp4</link>'
    )
  })

  it('fails when the local audio file is missing', async () => {
    const posts: Post[] = [
      {
        slug: 'ep',
        html: '<p>x</p>',
        attributes: {
          title: 'Ep',
          date: '2024-01-01T00:00:00.000Z',
          audio: '/audio/nope.m4a',
        },
      },
    ]
    await expect(
      buildFeeds(posts, { siteURL, publicDirectory: paths.publicDirectory })
    ).rejects.toThrow(
      'posts/ep.md: audio enclosure failed: cannot determine size of https://example.test/audio/nope.m4a'
    )
  })

  it('fails with a timeout when the server never answers', async () => {
    const fetch = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(init.signal?.reason)
          )
        })
    )
    await expect(podcast({ fetch, timeoutMs: 20 })).rejects.toThrow(
      'timed out after 20ms'
    )
  })
})

describe('runBuildJobs', () => {
  it('writes feeds into the given directory only', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'feeds-'))
    try {
      await runBuildJobs({
        ...paths,
        siteURL,
        outputDir: dir,
        fetch: headFetch(10),
      })
      const text = readFileSync(
        path.join(dir, 'jordan-frankfurt-blog-feed.xml'),
        'utf8'
      )
      expect(text).toContain('https://example.test/with-image')
      expect(readdirSync(dir)).toHaveLength(9)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('XML escaping', () => {
  const post: Post = {
    slug: 'esc',
    html: '<p>a &#x26; b</p>',
    attributes: {
      title: 'R&D "quoted" <b>',
      date: '2024-01-01T00:00:00.000Z',
      video: 'https://video.example.test/w?a=1&b=2',
    },
  }

  it('escapes ampersands once in URLs, titles and attributes', async () => {
    const [, , videos] = await buildFeeds([post], { siteURL })
    for (const xml of [videos.rss2, videos.atom1]) {
      expect(xml).toContain('https://video.example.test/w?a=1&amp;b=2')
      expect(xml).not.toContain('&amp;amp;')
      expect(xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')).not.toContain('<b>')
      assertWellFormed(xml)
    }
    expect(JSON.parse(videos.json1).items[0]).toMatchObject({
      title: 'R&D "quoted" <b>',
      url: 'https://video.example.test/w?a=1&b=2',
    })
  })
})
