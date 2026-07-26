import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Compiler rules introduced by eslint-config-next@16 / react-hooks v7.
    // TODO: address these incrementally and re-enable.
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
    },
  },
  {
    // eslint-config-next defaults settings.react.version to "detect", which
    // under ESLint 10 crashes (`contextOrFilename.getFilename is not a
    // function`) inside eslint-plugin-react's auto-detection code path —
    // no eslint-plugin-react release yet handles ESLint 10's removal of
    // `context.getFilename()`. Pinning the version explicitly skips that
    // detection code path entirely.
    settings: {
      react: {
        version: '19.2.7',
      },
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    'public/sw*',
    'public/swe-worker*',
  ]),
])

export default eslintConfig
