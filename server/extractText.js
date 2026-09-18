const path = require('path')

class ExtractError extends Error {}

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function kindFromFile(file) {
  const ext = path.extname(file.originalname || '').toLowerCase()
  if (file.mimetype === 'application/pdf' || ext === '.pdf') return 'pdf'
  if (file.mimetype === DOCX_MIME || ext === '.docx') return 'docx'
  if (file.mimetype === 'text/plain' || ext === '.txt') return 'txt'
  return null
}

// Aceito na entrada (multer fileFilter) por mimetype OU extensão — navegador/SO às
// vezes manda mimetype genérico (application/octet-stream) pra .docx/.pdf.
function isAcceptedContextFile(file) {
  return kindFromFile(file) !== null
}

async function extractTextFromFile(file) {
  const kind = kindFromFile(file)

  try {
    if (kind === 'pdf') {
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(file.buffer)
      return data.text || ''
    }
    if (kind === 'docx') {
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer: file.buffer })
      return result.value || ''
    }
    if (kind === 'txt') {
      return file.buffer.toString('utf-8')
    }
  } catch (err) {
    throw new ExtractError(`Não consegui ler o arquivo "${file.originalname}" (${err.message || 'formato inválido'})`)
  }

  throw new ExtractError(`Tipo de arquivo não suportado: "${file.originalname}"`)
}

module.exports = { extractTextFromFile, isAcceptedContextFile, ExtractError }
