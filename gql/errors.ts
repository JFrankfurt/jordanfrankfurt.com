import { ApolloError } from 'apollo-server-micro'

export const TokenMissingError = new ApolloError(
  'Please log in to make this request.',
  '401',
  {}
)

export const ServerError = new ApolloError(
  'Something went wrong on the server!',
  '500',
  {}
)
