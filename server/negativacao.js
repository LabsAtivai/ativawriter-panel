// Proxy autenticado para o painel de negativação (repo negativacaomailgun), que
// espalha o valor pela Lista de e-mails a não enviar de TODAS as contas Snov.io
// ativas. Aqui só valida e repassa — sem duplicar lógica de Snov.io.
// scope "commercial": o painel restringe às contas Snov.io do time comercial (lista permitida).
const PANEL_TIMEOUT_MS = 15000

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOMAIN_RE = /^(?=.{3,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

function panelUrl() {
  const url = process.env.NEGATIVACAO_API_URL
  return url ? url.replace(/\/+$/, '') : null
}

async function callPanel(path, init) {
  const base = panelUrl()
  if (!base) return { status: 503, body: { error: 'NEGATIVACAO_API_URL não configurada' } }
  try {
    const res = await fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(PANEL_TIMEOUT_MS) })
    const body = await res.json().catch(() => null)
    return { status: res.status, body }
  } catch {
    return { status: 502, body: { error: 'Painel de negativação indisponível' } }
  }
}

// O painel (FastAPI) responde { detail }; normaliza pro formato { error } deste app.
function send(res, out) {
  const b = out.body
  if (out.status >= 400 && b && typeof b === 'object' && !('error' in b)) {
    return res
      .status(out.status)
      .json({ error: typeof b.detail === 'string' ? b.detail : 'Erro no painel de negativação' })
  }
  res.status(out.status).json(out.body)
}

async function trigger(req, res) {
  const raw = typeof req.body?.value === 'string' ? req.body.value.trim().toLowerCase() : ''
  const value = raw.replace(/^@/, '')
  if (!EMAIL_RE.test(value) && !DOMAIN_RE.test(value)) {
    return res.status(400).json({ error: 'Valor inválido: use email@dominio.com ou dominio.com' })
  }
  req.log?.info({ kind: EMAIL_RE.test(value) ? 'email' : 'domain' }, 'negativação solicitada')
  send(
    res,
    await callPanel('/api/manual/runs/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, scope: 'commercial' }),
    })
  )
}

async function listRuns(req, res) {
  send(res, await callPanel('/api/manual/runs?limit=50'))
}

async function getRun(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'id inválido' })
  send(res, await callPanel(`/api/manual/runs/${id}`))
}

module.exports = { trigger, listRuns, getRun }
