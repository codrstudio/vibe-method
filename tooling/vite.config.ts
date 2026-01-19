import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

// Plugin para servir API de brands
function brandApiPlugin(): Plugin {
  const BRAND_DIR = path.resolve(__dirname, '../specs/brand')

  return {
    name: 'brand-api',
    configureServer(server) {
      // GET /api/schema - retorna o schema de validação
      server.middlewares.use('/api/schema', (req, res, next) => {
        if (req.method !== 'GET') return next()

        try {
          const schemaPath = path.join(BRAND_DIR, 'tooling', 'brand.schema.json')
          if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(schema)
          } else {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Schema não encontrado' }))
          }
        } catch (error) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(error) }))
        }
      })

      // GET /api/brands - lista todos os brands
      server.middlewares.use('/api/brands', (req, res, next) => {
        if (req.method !== 'GET') return next()

        try {
          const entries = fs.readdirSync(BRAND_DIR, { withFileTypes: true })
          const brands = []

          for (const entry of entries) {
            // Ignorar pastas de sistema (tooling, scripts, blueprint)
            if (entry.isDirectory() && !['tooling', 'scripts', 'blueprint'].includes(entry.name)) {
              const brandPath = path.join(BRAND_DIR, entry.name, 'brand.json')
              if (fs.existsSync(brandPath)) {
                const data = JSON.parse(fs.readFileSync(brandPath, 'utf-8'))
                brands.push({ id: entry.name, data })
              }
            }
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ brands }))
        } catch (error) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(error) }))
        }
      })

      // PUT /api/brands/:id - salva um brand
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/api\/brands\/([^/]+)$/)
        if (!match || req.method !== 'PUT') return next()

        const brandId = match[1]
        const brandPath = path.join(BRAND_DIR, brandId, 'brand.json')

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            fs.writeFileSync(brandPath, JSON.stringify(data, null, 2), 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(error) }))
          }
        })
      })

      // POST /api/brands/:id/apply - aplica um brand ao sistema
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/api\/brands\/([^/]+)\/apply$/)
        if (!match || req.method !== 'POST') return next()

        const brandId = match[1]
        const scriptPath = path.join(BRAND_DIR, 'tooling', 'scripts', 'brand.mjs')

        // Verificar se o script existe
        if (!fs.existsSync(scriptPath)) {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Script brand.mjs não encontrado' }))
          return
        }

        try {
          // Executar o script de apply com --theme-only
          const result = execSync(`node "${scriptPath}" apply ${brandId} --theme-only`, {
            cwd: path.resolve(BRAND_DIR, '..', '..'),
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
          })

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, output: result }))
        } catch (error: unknown) {
          const execError = error as { stderr?: string; message?: string }
          res.statusCode = 500
          res.end(JSON.stringify({
            error: 'Falha ao aplicar brand',
            details: execError.stderr || execError.message
          }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), brandApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
