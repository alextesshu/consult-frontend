import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const ANALYTICS_BUILD_ARGS = [
  'VITE_PRODUCT_ANALYTICS_ENABLED',
  'VITE_POSTHOG_PROJECT_TOKEN',
  'VITE_POSTHOG_API_HOST',
]

describe('frontend analytics build configuration', () => {
  it('exports stage-aware analytics build args to the Vite build without a token literal', () => {
    const dockerfile = readFileSync('Dockerfile', 'utf8')

    expect(dockerfile).toContain('ARG VITE_API_BASE_URL')
    for (const variable of ANALYTICS_BUILD_ARGS) {
      expect(dockerfile).toContain(`ARG ${variable}`)
      expect(dockerfile).toContain(`${variable}="\${${variable}:-`)
    }
    expect(dockerfile).toContain('npm run build')
    expect(dockerfile).not.toContain('phc_')
  })
})
