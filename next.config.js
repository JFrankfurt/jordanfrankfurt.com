const { resolve } = require('path')

module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\.xml/,
      type: 'asset/resource',
    })

    config.resolve.modules.push(resolve('./'))
    return config
  },
}
