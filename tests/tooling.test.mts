import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import postcss from 'postcss'
import tailwindcss from '@tailwindcss/postcss'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '..')
const require = createRequire(import.meta.url)
const nextRequire = createRequire(require.resolve('eslint-config-next'))
const pluginDir = path.dirname(nextRequire.resolve('@next/eslint-plugin-next'))
const { getRootDirs } = nextRequire(
  path.join(pluginDir, 'utils/get-root-dirs.js')
)

describe('Next lint root-directory discovery', () => {
  it('uses the safe glob replacement', () => {
    const pluginRequire = createRequire(
      nextRequire.resolve('@next/eslint-plugin-next')
    )
    expect(pluginRequire('fast-glob/package.json').name).toBe(
      '@jfrankfurt/next-root-glob'
    )
  })

  it('keeps the current directory when no root glob is configured', () => {
    expect(getRootDirs({ cwd: root, settings: {} })).toEqual([root])
  })

  it('expands brace patterns and returns only directories', () => {
    const dirs = getRootDirs({
      cwd: root,
      settings: {
        next: { rootDir: path.join(root, '{pages,components,package.json}') },
      },
    })
    expect(dirs.sort()).toEqual(
      [path.join(root, 'components'), path.join(root, 'pages')].sort()
    )
  })

  it('supports arrays of root globs and unmatched patterns', () => {
    const dirs = getRootDirs({
      cwd: root,
      settings: {
        next: {
          rootDir: [
            path.join(root, 'components'),
            path.join(root, 'pages'),
            path.join(root, 'missing-*'),
          ],
        },
      },
    })
    expect(dirs.sort()).toEqual(
      [path.join(root, 'components'), path.join(root, 'pages')].sort()
    )
  })

  it('still rejects plain links to internal pages with a root glob', async () => {
    const eslint = new ESLint({
      cwd: root,
      overrideConfig: { settings: { next: { rootDir: `${root}*` } } },
    })
    const [result] = await eslint.lintText(
      'export default function Page() { return <a href="/about">About</a> }',
      { filePath: path.join(root, 'pages/example.tsx') }
    )
    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: '@next/next/no-html-link-for-pages',
          severity: 2,
        }),
      ])
    )
  })
})

describe('Tailwind CSS migration', () => {
  it('generates the custom colors, animation, and responsive utilities', async () => {
    const from = path.join(root, 'styles/global.css')
    const css = await readFile(from, 'utf8')
    const result = await postcss([tailwindcss()]).process(css, { from })
    expect(result.css).toContain('.bg-strava')
    expect(result.css).toContain('--color-strava: #fc4c02')
    expect(result.css).toContain('.hover\\:text-linkHoverRed')
    expect(result.css).toContain('--color-linkHoverRed:')
    expect(result.css).toContain('.animate-marquee')
    expect(result.css).toContain('@keyframes marquee')
    expect(result.css).toContain('.motion-reduce\\:animate-none')
    expect(result.css).toContain('.md\\:hidden')
    expect(result.css).toContain('@layer base')
  })
})

describe('YAML CLI dependency override', () => {
  it('keeps front-matter parsing and serialization compatible', () => {
    const matter = require('gray-matter')
    const source = '---\ntitle: Example\ntags: [node, security]\n---\nBody\n'
    const parsed = matter(source)
    expect(parsed.data).toEqual({
      title: 'Example',
      tags: ['node', 'security'],
    })
    expect(matter(matter.stringify(parsed.content, parsed.data)).data).toEqual(
      parsed.data
    )
  })

  it('keeps the YAML CLI usable with argparse 2', () => {
    const matterRequire = createRequire(require.resolve('gray-matter'))
    const yamlDir = path.dirname(matterRequire.resolve('js-yaml/package.json'))
    const result = spawnSync(
      process.execPath,
      [path.join(yamlDir, 'bin/js-yaml.js'), '--help'],
      { encoding: 'utf8' }
    )
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('--compact')
  })
})
