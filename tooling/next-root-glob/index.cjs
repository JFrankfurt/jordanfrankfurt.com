const path = require('node:path')
const { globSync: tinyGlobSync } = require('tinyglobby')

function globSync(pattern, options = {}) {
  const absolute = path.isAbsolute(pattern)
  const matches = tinyGlobSync(pattern, {
    ...options,
    absolute,
    expandDirectories: false,
    cwd: absolute ? path.parse(pattern).root : options.cwd,
  })
  return matches.map((match) => {
    const normalized = path.normalize(match)
    return normalized.endsWith(path.sep) &&
      normalized !== path.parse(normalized).root
      ? normalized.slice(0, -1)
      : normalized
  })
}

module.exports = { globSync }
