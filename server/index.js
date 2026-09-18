require('dotenv').config()

const path = require('path')
const express = require('express')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const rateLimit = require('express-rate-limit')
const pinoHttp = require('pino-http')

const { logger } = require('./logger')
const { login, logout, requireAuth, sessionStatus } = require('./auth')
const { generateReply, OpenAiError } = require('./openaiClient')
const { extractTextFromFile, isAcceptedContextFile, ExtractError } = require('./extractText')

const requiredEnv = ['APP_PASSWORD', 'COOKIE_SECRET', 'OPENAI_API_KEY']
for (const key of requiredEnv) {
  if (!process.env[key]) {
    logger.error(`Variável de ambiente obrigatória ausente: ${key}`)
    process.exit(1)
  }
}

const app = express()
app.set('trust proxy', 1)

app.use(
  pinoHttp({
    logger,
    // Nunca logar corpo/headers com conteúdo de e-mail/print — só metadados da requisição.
    autoLogging: { ignore: (req) => req.method === 'OPTIONS' },
    serializers: {
      req(req) {
        return { method: req.method, url: req.url }
      },
    },
  })
)

app.use(express.json({ limit: '200kb' }))
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(express.static(path.join(__dirname, '..', 'public')))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024, files: 7 },
  fileFilter(req, file, cb) {
    if (file.fieldname === 'contextFile') {
      if (!isAcceptedContextFile(file)) {
        return cb(new Error('Contexto: só são aceitos arquivos PDF, DOCX ou TXT'))
      }
      return cb(null, true)
    }
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Somente arquivos de imagem são aceitos'))
    }
    cb(null, true)
  },
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas gerações em pouco tempo. Aguarde um pouco e tente de novo.' },
})

app.post('/api/login', loginLimiter, login)
app.post('/api/logout', logout)
app.get('/api/session', sessionStatus)

app.post(
  '/api/generate-reply',
  requireAuth,
  generateLimiter,
  upload.fields([
    { name: 'images', maxCount: 6 },
    { name: 'contextFile', maxCount: 1 },
  ]),
  async (req, res) => {
    const startedAt = Date.now()
    const { emailText, signature, clientContext, referenceBlock } = req.body || {}
    const files = req.files?.images || []
    const contextFile = req.files?.contextFile?.[0] || null

    try {
      const images = files.map((file) => ({
        mimeType: file.mimetype,
        base64: file.buffer.toString('base64'),
      }))

      let finalClientContext = typeof clientContext === 'string' ? clientContext : ''
      if (contextFile) {
        const extracted = await extractTextFromFile(contextFile)
        finalClientContext = [finalClientContext, extracted].filter((part) => part.trim()).join('\n\n')
      }

      const response = await generateReply({
        emailText: typeof emailText === 'string' ? emailText : '',
        signature: typeof signature === 'string' ? signature : '',
        clientContext: finalClientContext,
        referenceBlock: typeof referenceBlock === 'string' ? referenceBlock : '',
        images,
      })

      req.log.info(
        {
          imageCount: images.length,
          hasContextFile: !!contextFile,
          durationMs: Date.now() - startedAt,
          success: true,
        },
        'generate-reply ok'
      )
      res.json({ response })
    } catch (err) {
      const isOpenAiError = err instanceof OpenAiError
      const isExtractError = err instanceof ExtractError
      req.log.error(
        { durationMs: Date.now() - startedAt, success: false, isOpenAiError, isExtractError },
        'generate-reply falhou'
      )
      if (isExtractError) {
        return res.status(400).json({ error: err.message })
      }
      res.status(isOpenAiError ? 502 : 500).json({
        error: isOpenAiError ? err.message : 'Erro inesperado ao gerar resposta',
      })
    }
  }
)

// Erros do multer (arquivo grande demais, tipo inválido, etc.) chegam aqui.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || /imagem|Contexto:/.test(err?.message || '')) {
    return res.status(400).json({ error: err.message })
  }
  next(err)
})

app.use((err, req, res, next) => {
  req.log?.error({ err: err.message }, 'erro não tratado')
  res.status(500).json({ error: 'Erro inesperado' })
})

const port = process.env.PORT || 3300
app.listen(port, () => {
  logger.info(`AtivaWriter panel ouvindo na porta ${port}`)
})
