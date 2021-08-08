import { Feed, Item } from 'feed'
import { mkdirSync, writeFileSync } from 'fs'
import { getBlogPostsData } from 'utils/blog'

export async function runBuildJobs(): Promise<void> {
  await generateRssFeeds()
}

const encodeTitle = (s: string): string => s.toLowerCase().replace(/ /gi, '-')

const generateRssFeeds = async () => {
  const posts = await getBlogPostsData()
  const siteURL = process.env.SITE_URL || 'https://jordanfrankfurt.com'
  const date = new Date()
  const author = {
    name: 'Jordan Frankfurt',
    email: 'jordanwfrankfurt@gmail.com',
    link: 'https://twitter.com/JordanFrankfurt',
  }
  const baseFeed = {
    author,
    copyright: `All rights reserved ${date.getFullYear()}, Jordan Frankfurt`,
    description: 'mostly reading things',
    favicon: `${siteURL}/favicon.png`,
    generator: 'Feed for Node.js',
    title: 'Jordan Frankfurt',
    id: siteURL,
    image: `${siteURL}/me.jpg`,
    language: 'en',
    link: siteURL,
    updated: date,
  }
  const AudioFeed = new Feed({
    ...baseFeed,
    title: baseFeed.title + ' podcast',
    feedLinks: {
      rss2: `${siteURL}/rss/${encodeTitle(
        baseFeed.title + ' podcast'
      )}-feed.xml`,
      json: `${siteURL}/rss/${encodeTitle(
        baseFeed.title + ' podcast'
      )}-feed.json`,
      atom: `${siteURL}/rss/${encodeTitle(
        baseFeed.title + ' podcast'
      )}-atom.xml`,
    },
  })
  const TextFeed = new Feed({
    ...baseFeed,
    title: baseFeed.title + ' blog',
    feedLinks: {
      rss2: `${siteURL}/rss/${encodeTitle(baseFeed.title + ' blog')}-feed.xml`,
      json: `${siteURL}/rss/${encodeTitle(baseFeed.title + ' blog')}-feed.json`,
      atom: `${siteURL}/rss/${encodeTitle(baseFeed.title + ' blog')}-atom.xml`,
    },
  })
  const VideoFeed = new Feed({
    ...baseFeed,
    title: baseFeed.title + ' videos',
    feedLinks: {
      rss2: `${siteURL}/rss/${encodeTitle(
        baseFeed.title + ' videos'
      )}-feed.xml`,
      json: `${siteURL}/rss/${encodeTitle(
        baseFeed.title + ' videos'
      )}-feed.json`,
      atom: `${siteURL}/rss/${encodeTitle(
        baseFeed.title + ' videos'
      )}-atom.xml`,
    },
  })
  posts.forEach((post) => {
    const url = `${siteURL}${post.slug}`

    const item: Item = {
      author: [author],
      category: [{ name: 'Technology' }],
      content: post.html,
      contributor: [author],
      date: new Date(post.attributes.date),
      description: post.html,
      id: url,
      image: `${url}/me.jpg`,
      link: url,
      title: post.attributes.title,
    }

    if (post.attributes.audio) {
      item.link = post.attributes.audio
      item.audio = post.attributes.audio
      AudioFeed.addItem(item)
      return
    }

    if (post.attributes.video) {
      item.link = post.attributes.video
      item.video = post.attributes.video
      VideoFeed.addItem(item)
      return
    }

    TextFeed.addItem(item)
    return
  })
  const feeds = [AudioFeed, TextFeed, VideoFeed]
  feeds.forEach((feed) => {
    mkdirSync('./public/rss', { recursive: true })
    console.log(feed)
    const title = encodeTitle(feed.options.title)
    writeFileSync(`./public/rss/${title}-feed.xml`, feed.rss2())
    writeFileSync(`./public/rss/${title}-atom.xml`, feed.atom1())
    writeFileSync(`./public/rss/${title}-feed.json`, feed.json1())
  })
}
