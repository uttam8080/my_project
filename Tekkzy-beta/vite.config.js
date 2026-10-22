import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Dev-only: same-origin proxy for products.tekkzy.com templates so the builder
 * can load the LOCAL preview-bridge (theme recolor, CMS updates) without S3 deploy.
 * Preview URL: /__proxy_template/<slug>/
 */
function tekkzyLocalTemplateProxy() {
  const productsOrigin = 'https://products.tekkzy.com'
  const bridgePath = path.join(
    __dirname,
    'src',
    'pages',
    'builder',
    'preview-bridge.js',
  )
  // Prefer patched salon002 bundles when present (CSS vars + footer/theme hooks).
  const salonAssetsDir = path.resolve(__dirname, '..', '_bridge_test')
  const salonAssetMap = {
    'index-_7LKmWNN.js': path.join(salonAssetsDir, 'salon002-index.js'),
    'index-hGoBWeh-.css': path.join(salonAssetsDir, 'salon002.css'),
  }
  const salonDataLocal = path.resolve(__dirname, '..', 'SALON002-data.json')

  function sendLocalFile(res, filePath, contentType) {
    try {
      const body = fs.readFileSync(filePath)
      res.statusCode = 200
      res.setHeader('Content-Type', contentType)
      res.setHeader('Cache-Control', 'no-store')
      if (String(contentType).includes('json')) {
        res.setHeader('Access-Control-Allow-Origin', '*')
      }
      res.end(body)
      return true
    } catch {
      return false
    }
  }

  return {
    name: 'tekkzy-local-template-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || ''
        const pathname = rawUrl.split('?')[0]
        const query = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : ''

        // Local bridge — used by proxied template index.html and direct tests.
        if (
          pathname === '/__tekkzy/preview-bridge.js' ||
          pathname === '/_tekkzy/preview-bridge.js'
        ) {
          if (sendLocalFile(res, bridgePath, 'application/javascript; charset=utf-8')) {
            return
          }
          next()
          return
        }

        // /__proxy_template/salon002  → /__proxy_template/salon002/
        // Without the trailing slash, fetch("./data.json") resolves to
        // /__proxy_template/data.json (broken) instead of .../salon002/data.json.
        const bareDir = pathname.match(/^\/__proxy_template\/([^/]+)$/)
        if (bareDir) {
          res.statusCode = 301
          res.setHeader('Location', `/__proxy_template/${bareDir[1]}/${query}`)
          res.end()
          return
        }

        // CDN HTML often uses root-absolute /salon002/assets/* — rewrite those
        // through this same proxy when requested at the Vite origin, otherwise
        // the browser loads SPA HTML as "JS" and the preview goes blank.
        const bareProducts = pathname.match(
          /^\/([^/]+)\/(assets\/.+|data\.json)$/,
        )
        if (bareProducts) {
          const bareSlug = bareProducts[1]
          const bareRest = bareProducts[2]
          // Only rewrite known product-template style paths (not Vite src/api).
          if (
            bareSlug &&
            !bareSlug.startsWith('_') &&
            !bareSlug.startsWith('src') &&
            !bareSlug.startsWith('node_modules') &&
            bareSlug !== '@vite' &&
            bareSlug !== '@react-refresh' &&
            bareSlug !== '@fs' &&
            bareSlug !== 'assets'
          ) {
            req.url = `/__proxy_template/${bareSlug}/${bareRest}${query}`
          }
        }

        // Root-absolute /assets/* leaked by multipage builds when preview
        // navigated or was rewritten without the template slug.
        if (pathname.startsWith('/assets/')) {
          const ref = String(req.headers.referer || '')
          const refMatch =
            ref.match(/\/__proxy_template\/([^/]+)\//) ||
            ref.match(/products\.tekkzy\.com\/([^/]+)/)
          if (refMatch) {
            req.url = `/__proxy_template/${refMatch[1]}${pathname}${query}`
          }
        }

        // Mis-resolved relative data.json from missing trailing slash
        // (/__proxy_template/data.json). Serve from Referer slug when possible.
        if (pathname === '/__proxy_template/data.json') {
          const ref = String(req.headers.referer || '')
          const refMatch = ref.match(/\/__proxy_template\/([^/]+)\//)
          if (refMatch) {
            req.url = `/__proxy_template/${refMatch[1]}/data.json${query}`
          }
        }

        const proxyMatch = (req.url || '')
          .split('?')[0]
          .match(/^\/__proxy_template\/([^/]+)(?:\/(.*))?$/)
        if (!proxyMatch) {
          next()
          return
        }

        const slug = proxyMatch[1]
        let rest = proxyMatch[2] || ''
        if (!slug) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('Missing template slug. Use /__proxy_template/<slug>/')
          return
        }
        if (!rest || rest === '') rest = 'index.html'
        // Avoid path traversal
        if (rest.includes('..')) {
          res.statusCode = 400
          res.end('Bad path')
          return
        }

        // Local salon002 data + optional patched assets when present
        if (slug === 'salon002') {
          if (rest === 'data.json' && fs.existsSync(salonDataLocal)) {
            if (
              sendLocalFile(
                res,
                salonDataLocal,
                'application/json; charset=utf-8',
              )
            ) {
              return
            }
          }
          const assetName = rest.replace(/^assets\//, '')
          if (rest.startsWith('assets/') && salonAssetMap[assetName]) {
            const localAsset = salonAssetMap[assetName]
            if (fs.existsSync(localAsset)) {
              const ct = assetName.endsWith('.css')
                ? 'text/css; charset=utf-8'
                : 'application/javascript; charset=utf-8'
              if (sendLocalFile(res, localAsset, ct)) return
            }
          }
        }

        const targetUrl = `${productsOrigin}/${slug}/${rest}`
        try {
          const upstream = await fetch(targetUrl, {
            method: req.method || 'GET',
            headers: { Accept: '*/*' },
          })
          const buffer = Buffer.from(await upstream.arrayBuffer())
          let body = buffer
          const contentType =
            upstream.headers.get('content-type') || 'application/octet-stream'

          if (
            contentType.includes('text/html') ||
            rest.endsWith('.html') ||
            rest === 'index.html'
          ) {
            let html = buffer.toString('utf8')
            const baseHref = `/__proxy_template/${slug}/`
            const esc = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            // Root-absolute assets: /salon002/assets/x.js → proxy path
            html = html.replace(
              new RegExp(`([\\"'=(])/${esc}/`, 'g'),
              `$1/__proxy_template/${slug}/`,
            )
            // Vite/templates that emit /assets/* (no slug prefix)
            html = html.replace(
              /([\"'=(])\/assets\//g,
              `$1/__proxy_template/${slug}/assets/`,
            )
            // Ensure relative fetches (./data.json) resolve under this proxy dir.
            if (!/<base\s/i.test(html)) {
              html = html.replace(
                /<head[^>]*>/i,
                (m) => `${m}\n    <base href="${baseHref}">`,
              )
            }
            // Patch fetch so ./data.json never misses the proxy slug.
            const fetchPatch = `<script>
(function(){
  var DATA_URL = ${JSON.stringify(baseHref + 'data.json')};
  var BASE = ${JSON.stringify(baseHref)};
  var _fetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url);
      if (!url) return _fetch(input, init);
      if (url === './data.json' || url === 'data.json' || url === 'data.json/') {
        return _fetch(DATA_URL, init);
      }
      if (url.charAt(0) === '/' && url.indexOf('/__proxy_template/') !== 0 &&
          url.indexOf('/__tekkzy/') !== 0 && url.indexOf('/src/') !== 0) {
        // /assets/foo or /contact → stay under proxy basename when possible
        if (url.indexOf('/assets/') === 0) {
          return _fetch(BASE + url.replace(/^\\//, ''), init);
        }
      }
    } catch (e) {}
    return _fetch(input, init);
  };
})();
</script>`
            if (!html.includes('var DATA_URL =')) {
              html = html.replace(/<head[^>]*>/i, (m) => `${m}\n${fetchPatch}`)
            }
            // Force local preview-bridge with theme recolor support.
            html = html.replace(
              /(?:src|href)=["']\/_tekkzy\/preview-bridge\.js["']/g,
              'src="/__tekkzy/preview-bridge.js"',
            )
            html = html.replace(
              /(?:src|href)=["'][^"']*_tekkzy\/preview-bridge\.js["']/g,
              'src="/__tekkzy/preview-bridge.js"',
            )
            if (!html.includes('preview-bridge.js')) {
              html = html.replace(
                /<\/head>/i,
                '<script src="/__tekkzy/preview-bridge.js" defer></script></head>',
              )
            }
            body = Buffer.from(html, 'utf8')
          }

          res.statusCode = upstream.status
          res.setHeader(
            'Content-Type',
            contentType.includes('text/html')
              ? 'text/html; charset=utf-8'
              : contentType,
          )
          res.setHeader('Cache-Control', 'no-store')
          if (rest === 'data.json') {
            res.setHeader('Access-Control-Allow-Origin', '*')
          }
          res.end(body)
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: err?.message || 'Template proxy failed',
              target: targetUrl,
            }),
          )
        }
      })
    },
  }
}

/**
 * Local tunnel for IAM-signed API calls (e.g. /admin/upload-file).
 * Browser SigV4-signs for the real API host, then posts here to avoid CORS.
 * Middleware forwards the signed headers + body unchanged.
 */
function tekkzyDevApiProxy(apiBase) {
  return {
    name: 'tekkzy-dev-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__tekkzy_api/')) {
          next()
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        const apiPath = req.url.slice('/__tekkzy_api'.length).split('?')[0]
        const targetUrl = `${apiBase}${apiPath}`

        try {
          const chunks = []
          for await (const chunk of req) {
            chunks.push(chunk)
          }
          const bodyBuffer = Buffer.concat(chunks)

          const headers = {
            Accept: 'application/json',
          }

          // Forward auth + content headers from the browser-signed request.
          const forwardKeys = [
            'authorization',
            'content-type',
            'x-amz-date',
            'x-amz-security-token',
            'x-amz-content-sha256',
            'x-amz-user-agent',
          ]
          for (const key of forwardKeys) {
            const value = req.headers[key]
            if (typeof value === 'string' && value) {
              headers[key] = value
            }
          }

          if (!headers['content-type'] && bodyBuffer.length) {
            headers['content-type'] = 'application/json'
          }

          const upstream = await fetch(targetUrl, {
            method: req.method || 'POST',
            headers,
            body:
              req.method === 'GET' || req.method === 'HEAD'
                ? undefined
                : bodyBuffer,
          })

          const responseText = await upstream.text()
          res.statusCode = upstream.status
          const contentType = upstream.headers.get('content-type')
          if (contentType) {
            res.setHeader('Content-Type', contentType)
          }
          res.end(responseText)
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: err?.message || 'Dev API proxy failed',
            }),
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = (
    env.VITE_API_ENDPOINT ||
    'https://tg2d8qq95k.execute-api.us-east-2.amazonaws.com/dev'
  ).replace(/\/$/, '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      tekkzyLocalTemplateProxy(),
      tekkzyDevApiProxy(apiBase),
    ],
    build: {
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'animation-vendor': ['framer-motion', 'gsap'],
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        '@smithy/signature-v4',
        '@smithy/protocol-http',
        '@aws-crypto/sha256-js',
      ],
    },
  }
})
