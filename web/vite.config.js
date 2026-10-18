import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { adsTxt, googleConfig } from './src/utils/googleServices.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')
  const google = googleConfig(env)
  let site
  if (env.VITE_SITE_URL) {
    site = new URL(env.VITE_SITE_URL)
    if (site.protocol !== 'https:' || site.username || site.password || site.search || site.hash || site.pathname !== '/') {
      throw new Error('VITE_SITE_URL must be an HTTPS origin without a path, credentials, query or fragment')
    }
  }
  return {
    plugins: [
      react(),
      {
        name: 'production-search-metadata',
        transformIndexHtml() {
          // AdSense site verification; a meta tag loads no scripts or cookies before consent.
          const adsense = google.adsClient
            ? [{ tag: 'meta', attrs: { name: 'google-adsense-account', content: google.adsClient }, injectTo: 'head' }]
            : []
          if (!site) return adsense
          return [
            ...adsense,
            { tag: 'link', attrs: { rel: 'canonical', href: site.href }, injectTo: 'head' },
            { tag: 'meta', attrs: { property: 'og:url', content: site.href }, injectTo: 'head' },
            {
              tag: 'script', attrs: { type: 'application/ld+json' }, children: JSON.stringify({
                '@context': 'https://schema.org', '@type': 'WebSite',
                name: 'Chess Academy', url: site.href,
                description: 'Interactive chess lessons, openings, strategy and practice games.',
              }).replace(/</g, '\\u003c'), injectTo: 'head'
            },
          ]
        },
        generateBundle() {
          this.emitFile({
            type: 'asset', fileName: 'robots.txt', source:
              `User-agent: *\nAllow: /\n${site ? `Sitemap: ${site.href}sitemap.xml\n` : ''}`
          })
          if (google.adsClient && !existsSync(join(import.meta.dirname, 'public', 'ads.txt'))) {
            this.emitFile({ type: 'asset', fileName: 'ads.txt', source: adsTxt(google) })
          }
          if (site) this.emitFile({
            type: 'asset', fileName: 'sitemap.xml', source:
              `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${site.href}</loc></url></urlset>\n`
          })
        },
      },
    ],
    base: '/Chess-Academy/'
  }
})
