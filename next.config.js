const { resolve } = require('path')

module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\.md$/,
      loader: 'frontmatter-markdown-loader',
      options: {},
    })

    config.resolve.modules.push(resolve('./'))
    return config
  },
}
