import { Feed, Item } from 'feed'
import { mkdirSync, writeFileSync } from 'fs'
import { getBlogPostsData } from 'utils/blog'

export async function runBuildJobs(): Promise<void> {
  await generateRssFeed()
}

const generateRssFeed = async () => {
  const posts = await getBlogPostsData()
  const siteURL = process.env.SITE_URL || 'https://jordanfrankfurt.com'
  const date = new Date()
  const author = {
    name: 'Jordan Frankfurt',
    email: 'jordanwfrankfurt@gmail.com',
    link: 'https://twitter.com/JordanFrankfurt',
  }
  const feed = new Feed({
    title: "Jordan Frankfurt's blog",
    description: '',
    id: siteURL,
    link: siteURL,
    image: `${siteURL}/me.png`,
    favicon: `${siteURL}/favicon.png`,
    copyright: `All rights reserved ${date.getFullYear()}, Jordan Frankfurt`,
    updated: date,
    generator: 'Feed for Node.js',
    feedLinks: {
      rss2: `${siteURL}/rss/feed.xml`,
      json: `${siteURL}/rss/feed.json`,
      atom: `${siteURL}/rss/atom.xml`,
    },
    author,
  })
  posts.forEach((post) => {
    const url = `${siteURL}${post.slug}`

    const item: Item = {
      title: post.attributes.title,
      id: url,
      link: url,
      description: post.html,
      content: post.html,
      author: [author],
      contributor: [author],
      date: new Date(post.attributes.date),
    }

    if (post.attributes.audio) {
      item.audio = post.attributes.audio
    }

    if (post.attributes.video) {
      item.video = post.attributes.video
    }

    feed.addItem(item)
  })
  mkdirSync('./public/rss', { recursive: true })
  writeFileSync('./public/rss/feed.xml', feed.rss2())
  writeFileSync('./public/rss/atom.xml', feed.atom1())
  writeFileSync('./public/rss/feed.json', feed.json1())
}
