import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  addImageDimensions,
  getBlogPostsData,
  getPostBySlug,
  getPostSlugs,
  parsePost,
  PostError,
  resolvePublicFile,
  sortPostsNewestFirst,
} from '../utils/blog'

const fixtures = path.join(import.meta.dirname, 'fixtures/blog')
const paths = {
  postsDirectory: path.join(fixtures, 'posts'),
  publicDirectory: path.join(fixtures, 'public'),
}

const parse = (source: string, file = 'posts/test.md') =>
  parsePost(file, source, 'test', paths.publicDirectory)

describe('front matter', () => {
  it('returns typed attributes with an ISO UTC date', async () => {
    const post = await getPostBySlug('plain', paths)
    expect(post.attributes).toEqual({
      date: '2024-03-01T17:00:00.000Z',
      title: 'Plain post & "quotes" <tag> ]]> done',
    })
    expect(post.slug).toBe('plain')
  })

  it('keeps optional audio and video and omits absent keys', async () => {
    const audio = await getPostBySlug('episode-local', paths)
    expect(audio.attributes).toEqual({
      audio: '/audio/local-episode.m4a',
      date: '2024-06-03T08:30:00.000Z',
      title: 'Local episode',
    })
    const video = await getPostBySlug('watch', paths)
    expect(Object.keys(video.attributes).sort()).toEqual([
      'date',
      'title',
      'video',
    ])
  })

  it('accepts date-only and quoted ISO dates as UTC', async () => {
    expect(
      (await parse('---\ntitle: a\ndate: 2021-04-15\n---\nx')).attributes.date
    ).toBe('2021-04-15T00:00:00.000Z')
    expect(
      (await parse('---\ntitle: a\ndate: "2021-04-15T01:36:00-05:00"\n---\nx'))
        .attributes.date
    ).toBe('2021-04-15T06:36:00.000Z')
  })

  it.each([
    [
      'missing title',
      '---\ndate: 2021-01-01\n---\nx',
      'missing required "title"',
    ],
    [
      'blank title',
      '---\ntitle: " "\ndate: 2021-01-01\n---\nx',
      'missing required "title"',
    ],
    [
      'numeric title',
      '---\ntitle: 12\ndate: 2021-01-01\n---\nx',
      'missing required "title"',
    ],
    ['no front matter', 'just text', 'missing required "title"'],
    ['missing date', '---\ntitle: a\n---\nx', 'missing required "date"'],
    [
      'bad date string',
      '---\ntitle: a\ndate: next tuesday\n---\nx',
      '"date" must be an ISO 8601 date, got "next tuesday"',
    ],
    [
      'numeric date',
      '---\ntitle: a\ndate: 12\n---\nx',
      '"date" must be an ISO 8601 date, got 12',
    ],
    [
      'empty audio',
      '---\ntitle: a\ndate: 2021-01-01\naudio:\n---\nx',
      '"audio" must be an http(s) URL',
    ],
    [
      'non-string video',
      '---\ntitle: a\ndate: 2021-01-01\nvideo: [1]\n---\nx',
      '"video" must be an http(s) URL',
    ],
    [
      'unsafe audio scheme',
      '---\ntitle: a\ndate: 2021-01-01\naudio: "javascript:alert(1)"\n---\nx',
      '"audio" must be an http(s) URL',
    ],
    ['broken yaml', '---\ntitle: [unclosed\n---\nx', 'invalid front matter'],
  ])(
    'rejects %s with a file-specific error',
    async (_name, source, message) => {
      const error = await parse(source, 'posts/bad-post.md').catch((e) => e)
      expect(error).toBeInstanceOf(PostError)
      expect(error.file).toBe('posts/bad-post.md')
      expect(error.message).toMatch(/^posts\/bad-post\.md: /)
      expect(error.message).toContain(message)
    }
  )
})

describe('rendering', () => {
  it('renders markdown and strips unsafe HTML', async () => {
    const { html } = await getPostBySlug('plain', paths)
    expect(html).toContain('<strong>world</strong>')
    expect(html).toContain('href="https://example.com/?a=1&#x26;b=2"')
    expect(html).not.toContain('<script')
  })

  it('adds image dimensions only to local images that exist', async () => {
    const { html } = await getPostBySlug('with-image', paths)
    expect(html).toContain(
      '<img src="/images/pixel.png" alt="Pixel" width="3" height="2">'
    )
    expect(html).toContain(
      '<img src="https://example.com/remote.png" alt="Remote">'
    )
    expect(html).toContain('<img src="/images/missing.png" alt="Missing">')
    expect(html).not.toMatch(/alt="Escape"[^>]*width/)
  })

  it('does not read files outside the public directory', () => {
    expect(resolvePublicFile(paths.publicDirectory, '/images/pixel.png')).toBe(
      path.join(paths.publicDirectory, 'images/pixel.png')
    )
    expect(
      resolvePublicFile(paths.publicDirectory, '/../posts/plain.md')
    ).toBeNull()
    expect(
      resolvePublicFile(paths.publicDirectory, '/%2e%2e/posts/plain.md')
    ).toBeNull()
    expect(resolvePublicFile(paths.publicDirectory, '/%E0%A4%A')).toBeNull()
    const input = '<img src="../../posts/plain.md" alt="x">'
    expect(addImageDimensions(input, paths.publicDirectory)).toBe(input)
  })

  it('leaves images alone when the file is not an image or is a directory', () => {
    const notImage = '<img src="/audio/local-episode.m4a" alt="x">'
    expect(addImageDimensions(notImage, paths.publicDirectory)).toBe(notImage)
    const dir = '<img src="/images" alt="x">'
    expect(addImageDimensions(dir, paths.publicDirectory)).toBe(dir)
  })
})

describe('post collection', () => {
  it('lists slugs in a stable order', () => {
    expect(getPostSlugs(paths)).toEqual([
      'episode-local',
      'episode-remote',
      'plain',
      'watch',
      'with-image',
    ])
  })

  it('sorts newest first without mutating the input', async () => {
    const posts = await getBlogPostsData(paths)
    const before = posts.map((p) => p.slug)
    expect(sortPostsNewestFirst(posts).map((p) => p.slug)).toEqual([
      'episode-remote',
      'episode-local',
      'with-image',
      'plain',
      'watch',
    ])
    expect(posts.map((p) => p.slug)).toEqual(before)
  })

  it('rejects slugs that are not plain file names', async () => {
    for (const slug of ['', '../plain', 'a/b', '.hidden']) {
      await expect(getPostBySlug(slug, paths)).rejects.toThrow(
        'Invalid post slug'
      )
    }
  })
})

describe('real posts', () => {
  it('render identically for the index and detail pages', async () => {
    const list = await getBlogPostsData()
    expect(list.map((p) => p.slug)).toEqual(getPostSlugs())
    for (const post of list) {
      expect(await getPostBySlug(post.slug)).toEqual(post)
    }
    const targets = list.find((p) => p.slug === 'tactical-games-targets')
    expect(
      targets?.html.match(/<img [^>]*width="\d+" height="\d+">/g)
    ).toHaveLength(6)
  })
})
