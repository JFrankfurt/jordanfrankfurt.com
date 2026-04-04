import coreWebVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  ...coreWebVitals,
  {
    ignores: ['.next/'],
  },
]

export default eslintConfig
