import { makeExecutableSchema } from 'graphql-tools'
import { typeDefs } from 'gql/type-defs'
import { resolvers } from 'gql/resolvers'

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})
