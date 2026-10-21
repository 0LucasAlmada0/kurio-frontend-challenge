const desktop = process.env.LH_PROFILE === 'desktop'

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview -- --port 4174 --strictPort',
      startServerReadyPattern: 'Local:',
      url: ['http://127.0.0.1:4174/', 'http://127.0.0.1:4174/nfts/emerald-ape-042'],
      numberOfRuns: 3,
      settings: desktop ? { preset: 'desktop', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] } : { onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9, aggregationMethod: 'median' }],
        'categories:accessibility': ['warn', { minScore: 0.95, aggregationMethod: 'median' }],
        'categories:best-practices': ['warn', { minScore: 0.95, aggregationMethod: 'median' }],
        'categories:seo': ['warn', { minScore: 0.9, aggregationMethod: 'median' }],
      },
    },
    upload: { target: 'filesystem', outputDir: `.lighthouseci/${desktop ? 'desktop' : 'mobile'}` },
  },
}
