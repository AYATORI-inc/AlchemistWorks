import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const gasUrl = env.VITE_GAS_URL

  return {
    plugins: [
      react(),
      // GAS は 302 で script.googleusercontent.com にリダイレクトする。
      // 標準 proxy は 302 をそのまま返すため、ブラウザが直接アクセスして CORS エラーになる。
      // fetch でサーバー側からリダイレクトを追従してプロキシする。
      gasUrl
        ? (() => {
            const baseUrl = gasUrl.split('?')[0]
            return {
              name: 'gas-proxy',
              enforce: 'pre', // history fallback より先に /api を処理
              configureServer(server) {
                server.middlewares.use(async (req, res, next) => {
                  if (!req.url?.startsWith('/api')) return next()
                  const subPath = req.url.replace(/^\/api\/?/, '') || 'index'
                  const [pathPart, query] = subPath.split('?')
                  const url = `${baseUrl}?path=${encodeURIComponent(pathPart)}${query ? '&' + query : ''}`
                  try {
                    const headers: Record<string, string> = { ...(req.headers as Record<string, string>) }
                    delete headers.host
                    const init: RequestInit = {
                      method: req.method || 'GET',
                      headers,
                    }
                    if (req.method !== 'GET' && req.method !== 'HEAD') {
                      const body = await new Promise<Buffer>((resolve, reject) => {
                        const chunks: Buffer[] = []
                        req.on('data', (c) => chunks.push(c))
                        req.on('end', () => resolve(Buffer.concat(chunks)))
                        req.on('error', reject)
                      })
                      init.body = body.length ? body : undefined
                    }
                    const proxied = await fetch(url, init)
                    res.statusCode = proxied.status
                    const body = Buffer.from(await proxied.arrayBuffer())
                    // arrayBuffer() は自動で解凍するため、Content-Encoding を転送すると
                    // クライアントが解凍済みデータを再度解凍しようとして ERR_CONTENT_DECODING_FAILED になる
                    proxied.headers.forEach((v, k) => {
                      const lower = k.toLowerCase()
                      if (lower !== 'content-encoding' && lower !== 'content-length') {
                        res.setHeader(k, v)
                      }
                    })
                    res.setHeader('Content-Length', String(body.length))
                    res.setHeader('Access-Control-Allow-Origin', '*')
                    res.end(body)
                  } catch (e) {
                    res.statusCode = 502
                    res.end(JSON.stringify({ error: String(e) }))
                  }
                })
              },
            }
          })()
        : null,
    ].filter(Boolean),
    server: {
      port: 5173,
      // gas-proxy プラグインで /api を処理するため、proxy は無効化
      proxy: {},
    },
  }
})
