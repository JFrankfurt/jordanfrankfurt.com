import { Feed, FeedOptions, Item } from 'feed'
import { mkdirSync, writeFileSync } from 'fs'
import { getBlogPostsData } from 'utils/blog'
import fetch from 'node-fetch'
import { join } from 'path'

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

  const baseFeed: FeedOptions = {
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

  const audioFeed = new Feed({
    ...baseFeed,
    title: `${baseFeed.title} podcast`,
    feedLinks: {
      rss2: new URL(`rss/${encodeTitle(`${baseFeed.title} podcast`)}-feed.xml`, siteURL).toString(),
      json: new URL(`rss/${encodeTitle(`${baseFeed.title} podcast`)}-feed.json`, siteURL).toString(),
      atom: new URL(`rss/${encodeTitle(`${baseFeed.title} podcast`)}-atom.xml`, siteURL).toString(),
    },
  })

  const textFeed = new Feed({
    ...baseFeed,
    title: `${baseFeed.title} blog`,
    feedLinks: {
      rss2: new URL(`rss/${encodeTitle(`${baseFeed.title} blog`)}-feed.xml`, siteURL).toString(),
      json: new URL(`rss/${encodeTitle(`${baseFeed.title} blog`)}-feed.json`, siteURL).toString(),
      atom: new URL(`rss/${encodeTitle(`${baseFeed.title} blog`)}-atom.xml`, siteURL).toString(),
    },
  })

  const videoFeed = new Feed({
    ...baseFeed,
    title: `${baseFeed.title} videos`,
    feedLinks: {
      rss2: new URL(`rss/${encodeTitle(`${baseFeed.title} videos`)}-feed.xml`, siteURL).toString(),
      json: new URL(`rss/${encodeTitle(`${baseFeed.title} videos`)}-feed.json`, siteURL).toString(),
      atom: new URL(`rss/${encodeTitle(`${baseFeed.title} videos`)}-atom.xml`, siteURL).toString(),
    },
  })

  for (const post of posts) {
    const postUrl = new URL(post.slug.startsWith('/') ? post.slug.slice(1) : post.slug, siteURL).toString()
    const item: Item = {
      author: [author],
      category: [{ name: 'Technology' }],
      content: post.html,
      contributor: [author],
      date: new Date(post.attributes.date),
      description: post.html,
      id: postUrl,
      link: postUrl,
      title: post.attributes.title,
    }

    if (post.attributes.audio) {
      const audioUrl = new URL(post.attributes.audio, siteURL).toString()
      item.audio = audioUrl
      try {
        const response = await fetch(audioUrl)
        const data = await response.arrayBuffer()
        item.enclosure = {
          url: audioUrl,
          type: 'audio/mp4',
          title: item.title,
          length: data.byteLength,
        }
        item.link = audioUrl
        audioFeed.addItem(item)
      } catch (error) {
        console.error(`Failed to fetch audio for ${item.title}:`, error)
      }
    } else if (post.attributes.video) {
      const videoUrl = new URL(post.attributes.video, siteURL).toString()
      item.link = videoUrl
      item.video = videoUrl
      videoFeed.addItem(item)
    } else {
      textFeed.addItem(item)
    }
  }

  const outputDir = './public/rss'
  mkdirSync(outputDir, { recursive: true })

  const feeds = [audioFeed, textFeed, videoFeed]
  feeds.forEach((feed) => {
    const title = encodeTitle(feed.options.title)
    writeFileSync(join(outputDir, `${title}-feed.xml`), feed.rss2())
    writeFileSync(join(outputDir, `${title}-atom.xml`), feed.atom1())
    writeFileSync(join(outputDir, `${title}-feed.json`), feed.json1())
  })
}