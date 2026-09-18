const SESSION_COOKIE = 'aw_session'
const SESSION_VALUE = 'ok'

function login(req, res) {
  const { password } = req.body || {}
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Senha obrigatória' })
  }
  if (password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' })
  }
  res.cookie(SESSION_COOKIE, SESSION_VALUE, {
    signed: true,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })
  res.json({ ok: true })
}

function logout(req, res) {
  res.clearCookie(SESSION_COOKIE)
  res.json({ ok: true })
}

function requireAuth(req, res, next) {
  if (req.signedCookies?.[SESSION_COOKIE] === SESSION_VALUE) return next()
  res.status(401).json({ error: 'Não autenticado' })
}

function sessionStatus(req, res) {
  res.json({ authenticated: req.signedCookies?.[SESSION_COOKIE] === SESSION_VALUE })
}

module.exports = { login, logout, requireAuth, sessionStatus }
