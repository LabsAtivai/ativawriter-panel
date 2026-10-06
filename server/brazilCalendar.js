// Calendário brasileiro + horário de Brasília (America/Sao_Paulo), padrão do sistema.
// Portado de mailhub/apps/backend/src/lib/brazilCalendar.ts — manter sincronizado.
const BRASILIA_TZ = 'America/Sao_Paulo'

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

// Feriados nacionais fixos (MM-DD).
const FIXED_HOLIDAYS = {
  '01-01': 'Confraternização Universal',
  '04-21': 'Tiradentes',
  '05-01': 'Dia do Trabalho',
  '09-07': 'Independência do Brasil',
  '10-12': 'Nossa Senhora Aparecida',
  '11-02': 'Finados',
  '11-15': 'Proclamação da República',
  '11-20': 'Consciência Negra',
  '12-25': 'Natal',
}

function brasiliaNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: BRASILIA_TZ,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  )
  return { year: +parts.year, month: +parts.month, day: +parts.day, hour: +parts.hour, minute: +parts.minute }
}

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher).
function easter(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

const pad = (n) => String(n).padStart(2, '0')
const key = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
const addDays = (d, n) => new Date(d.getTime() + n * 86400000)

// Mapa 'YYYY-MM-DD' -> nome, com fixos e móveis (Carnaval, Sexta-feira Santa, Corpus Christi).
function holidaysOf(year) {
  const map = new Map()
  for (const [md, name] of Object.entries(FIXED_HOLIDAYS)) map.set(`${year}-${md}`, name)
  const pascoa = easter(year)
  map.set(key(addDays(pascoa, -48)), 'Segunda-feira de Carnaval')
  map.set(key(addDays(pascoa, -47)), 'Terça-feira de Carnaval')
  map.set(key(addDays(pascoa, -2)), 'Sexta-feira Santa')
  map.set(key(addDays(pascoa, 60)), 'Corpus Christi')
  return map
}

// Bloco de contexto temporal pra injetar no prompt: data/hora atual em Brasília
// e os próximos dias úteis já filtrados (sem fim de semana nem feriado).
function brasiliaPromptContext(now = new Date(), businessDays = 7) {
  const n = brasiliaNow(now)
  const today = new Date(Date.UTC(n.year, n.month - 1, n.day))
  const holidays = new Map([...holidaysOf(n.year), ...holidaysOf(n.year + 1)])
  const fmt = (d) =>
    `${WEEKDAYS[d.getUTCDay()]}, ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`

  const lines = [`Agora: ${fmt(today)}, ${pad(n.hour)}h${pad(n.minute)} (horário de Brasília).`]
  const todayHoliday = holidays.get(key(today))
  if (todayHoliday) lines.push(`Hoje é feriado nacional: ${todayHoliday}.`)

  const days = []
  for (let i = 1; days.length < businessDays && i < 30; i++) {
    const d = addDays(today, i)
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6 || holidays.has(key(d))) continue
    days.push(fmt(d))
  }
  lines.push('Próximos dias úteis válidos (nunca use outras datas):')
  lines.push(...days.map((d) => `- ${d}`))

  const limit = key(addDays(today, 30))
  const upcoming = [...holidays.entries()]
    .filter(([k]) => k > key(today) && k <= limit)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, name]) => {
      const [, m, d] = k.split('-').map(Number)
      return `${pad(d)}/${pad(m)} (${name})`
    })
  if (upcoming.length) lines.push(`Feriados nos próximos 30 dias: ${upcoming.join(', ')}.`)
  return lines.join('\n')
}

module.exports = { BRASILIA_TZ, brasiliaNow, holidaysOf, brasiliaPromptContext }
