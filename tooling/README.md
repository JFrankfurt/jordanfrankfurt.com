# Security dependency overrides

## Next.js root-directory discovery

Next.js 16's ESLint plugin uses `fast-glob.globSync` to discover configured root directories. Its `fast-glob → micromatch → braces` dependency chain has an unpatched high-severity stack-exhaustion vulnerability.

The root package overrides this dependency with the local `next-root-glob` adapter. It uses `tinyglobby` without `braces`, disables recursive expansion of directory patterns, and preserves absolute paths and directory-only matching. Next.js and its lint rules stay on the current version.

Only the `globSync(pattern, options)` API used by the Next.js plugin is implemented. Do not use this adapter as a general-purpose `fast-glob` replacement. The override is scoped to `@next/eslint-plugin-next`.

## YAML CLI

`gray-matter` uses `js-yaml` 3, whose CLI depends on `argparse` 1 and the vulnerable `sprintf-js` formatter. A scoped override replaces that CLI dependency with `argparse` 2, which retains the legacy CLI APIs without depending on `sprintf-js`. The YAML parser stays on its existing major version, so front-matter parsing is unchanged.

## Validation and removal

`tests/tooling.test.mts` checks directory discovery, verifies the internal-link lint rule still fires with a root-directory glob, and tests front-matter round-tripping and the YAML CLI.

Remove each override when the corresponding upstream package removes its vulnerable dependency chain. Remove the local glob adapter and its direct dependency together with the Next.js override.
