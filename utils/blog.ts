export interface Post {
  attributes: {
    audio?: string
    date: string
    title: string
    video?: string
  }
  html: string
  slug: string
}

export async function getBlogPostsData(): Promise<Post[]> {
  // https://webpack.js.org/guides/dependency-management/#requirecontext
  const markdownFiles = require
    // @ts-ignore
    .context('posts', false, /\.md$/)
    .keys()
    .filter((path: string) => path.substring(0, 1) !== '.')

  return Promise.all(
    markdownFiles.map(async (path: string) => {
      const markdown = await import(`../${path}`)
      // .substring removes ".md" from path
      let slug = path.substring(0, path.length - 3)
      // .slice removes posts prefix
      slug = slug.slice('posts'.length)
      return { ...markdown, slug }
    })
  )
}
