import { ApolloClient } from 'apollo-client'
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'

export default function createApolloClient(
  initialState: NormalizedCacheObject,
  ctx: any
) {
  // The `ctx` (NextPageContext) will only be present on the server.
  // use it to extract auth headers (ctx.req) or similar.
  const dev = process.env.NODE_ENV === 'development'
  const protocol = dev ? 'http' : 'https'
  const host = dev ? 'localhost:3000' : 'jordanfrankfurt.com'
  return new ApolloClient({
    ssrMode: Boolean(ctx),
    link: new HttpLink({
      uri: `${protocol}://${host}/api/graphql`,
      credentials: 'same-origin',
    }),
    cache: new InMemoryCache().restore(initialState),
  })
}
