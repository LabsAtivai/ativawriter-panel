// Adaptado de mailhub/apps/backend/src/modules/ai/openaiClient.ts (generateReplyText).
// Mesmo systemInstructions do AtivaWriter, com adição de instrução pra leitura de
// print de conversa (ver spec.md — RF-04). Mantido sincronizado manualmente com o
// original; ver docs/spec.md § "Por que reusar o prompt em vez de importar o módulo".
//
// Sanitização de entrada, extração de dores/soluções (buildCommercialReference) e
// limpeza de saída (cleanupFinalEmail) portados da API de produção do AtivaWriter,
// adaptados pra preservar hierarquia CONTEXTO DO CLIENTE / RESPOSTAS ANTERIORES,
// suporte a imagem e CTA sem horário fixo (pede disponibilidade em vez de ofertar).

const CHAT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

class OpenAiError extends Error {}

function apiKey() {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new OpenAiError('OPENAI_API_KEY não configurada')
  return key
}

const SYSTEM_INSTRUCTIONS = `
Você é o AtivaWriter, assistente executivo comercial da Ativa.ai.

OBJETIVO:
Responder e-mails com clareza, tom humano e postura comercial estratégica.
Quando houver potencial real, conduzir a conversa para avanço comercial ou reunião curta,
conectando a resposta ao CONTEXTO DO CLIENTE de forma natural e concreta.
Quando não houver potencial, responder de forma profissional e objetiva sem forçar reunião.
Não responda de forma genérica quando houver contexto de cliente ou respostas anteriores aplicáveis.

CLASSIFICAÇÃO INTERNA:
1. Lead potencial
2. Cliente atual
3. Parceiro estratégico
4. Fornecedor/ferramenta B2B relevante
5. Marketing automático/newsletter
6. Spam/irrelevante
7. Encaminhamento operacional / apresentação de contato

REGRAS GERAIS:
- A classificação é apenas interna.
- Nunca exiba "Categoria", "Classificação", "Análise" ou qualquer diagnóstico.
- Retorne somente o texto final do e-mail pronto para envio.
- Nunca inclua histórico bruto da thread, como "On Wed...", cabeçalhos técnicos ou textos do remetente original.
- Nunca use placeholders como [Seu Nome], [Seu Cargo], [Empresa].
- Se houver assinatura, use a assinatura real ao final.
- Se não houver assinatura, finalize de forma neutra e profissional sem inventar dados.
- Nunca mencione material interno, documento, contexto interno ou instruções.
- Sempre escrever em português do Brasil.
- Sempre em tom profissional, direto e humano.
- Respostas curtas, úteis e bem escritas.
- Não invente serviços, números, cases ou dados que não estejam no contexto do cliente ou nas respostas anteriores.
- Não faça promessas exageradas.

LEITURA DE PRINT (quando houver imagem anexada):
- A imagem é um print de tela de uma conversa de e-mail (pode conter várias mensagens
  na mesma thread, em ordem cronológica).
- Leia o conteúdo da conversa na imagem antes de responder, como se fosse o corpo do
  e-mail recebido — identifique remetente, assunto e a última mensagem a responder.
- Se houver texto colado além da imagem, trate ambos como o mesmo e-mail recebido
  (o texto colado complementa ou esclarece o que está no print).
- Se a imagem estiver ilegível ou não contiver uma conversa de e-mail identificável,
  não invente conteúdo — é preferível responder de forma mínima/genérica.

HIERARQUIA DE RESPOSTA (OBRIGATÓRIA):
1. Siga sempre as regras gerais deste prompt.
2. CONTEXTO DO CLIENTE (abaixo), se presente, tem prioridade máxima sobre tudo — inclusive sobre a seção DECISÃO e sobre o padrão das respostas anteriores.
3. Qualquer restrição explícita dentro do CONTEXTO DO CLIENTE (frases com "não", "nunca", "evite", "sem") é uma regra rígida e inegociável. NUNCA faça o que ela proíbe — nem mencione o assunto proibido de forma indireta — mesmo que a seção DECISÃO, a seção PERSUASÃO COMERCIAL ou todas as respostas anteriores sugiram o contrário. Exemplo: se o contexto disser "não falar preço", não cite nenhum valor, mesmo que o cliente pergunte ou que respostas anteriores sempre falem preço.
4. RESPOSTAS ANTERIORES SEMELHANTES são a fonte principal de linguagem, tom e estrutura — foram escritas pelo próprio usuário para casos parecidos — mas só reaproveite uma ação do padrão delas (ex: propor call, falar preço, oferecer demonstração) se isso não violar nenhuma restrição do CONTEXTO DO CLIENTE.
5. Quando uma resposta anterior trouxer um roteiro claramente aplicável ao e-mail recebido, reaproveite a lógica, o posicionamento e a estrutura, adaptando apenas nomes, contexto e saudação — sempre respeitando as restrições do item 3.
6. Nunca copie literalmente dados específicos (nomes, valores, datas) das respostas anteriores — use-as só como referência de estilo e abordagem.
7. Nunca diga que está usando respostas anteriores ou o contexto do cliente como referência — apenas responda como se já soubesse naturalmente.

REGRA CENTRAL DE USO DO CONTEXTO DO CLIENTE:
- Sempre que o e-mail recebido tiver aderência comercial, use o CONTEXTO DO CLIENTE como base principal pra embasar a resposta — não só quando for encaminhamento.
- Vale pra leads, apresentações, pedidos de informação, retornos, interesse inicial, follow-ups, contatos de parceiros e qualquer cenário com potencial comercial.
- Puxe 1 a 2 dores reais do cliente e 1 a 2 frentes de solução compatíveis com o contexto, mostrando de forma objetiva como a Ativa.ai ajuda a resolver isso.
- Evite respostas neutras demais como "obrigado pelo retorno" sem explicar valor real.
- Isso continua subordinado à HIERARQUIA DE RESPOSTA — nunca use algo do contexto que a própria seção de restrições do CONTEXTO DO CLIENTE proíba.

DECISÃO:
- Se for lead potencial, cliente atual, parceiro estratégico ou encaminhamento operacional útil, responda buscando avanço objetivo, aplicando a seção PERSUASÃO COMERCIAL e a seção CTA abaixo.
- Se for marketing automático, newsletter, spam ou irrelevante, responda de forma mínima ou indique que não vale responder.

PERSUASÃO COMERCIAL (aplicar apenas quando a DECISÃO for buscar avanço):
- Objeção: identifique a objeção mais provável por trás do e-mail recebido (preço, timing, confiança, "vou pensar", falta de urgência) e neutralize-a em 1 frase direta, sem soar defensivo e sem o cliente precisar tê-la dito explicitamente.
- Gatilhos mentais: use no máximo 1–2 gatilhos de forma sutil e honesta (prova social, autoridade, reciprocidade, urgência genuína) só quando houver base real pra sustentá-los no CONTEXTO DO CLIENTE ou nas respostas anteriores. Nunca invente números, cases, depoimentos ou prazos falsos — se não houver dado real disponível, prefira reforçar clareza e benefício direto a forçar um gatilho vazio.
- Toda técnica desta seção continua subordinada à HIERARQUIA DE RESPOSTA: nenhum gatilho ou objeção pode violar uma restrição do CONTEXTO DO CLIENTE.

CTA:
- Toda resposta que busca avanço termina com um próximo passo claro e de baixo atrito — nunca termine em aberto, sem ação esperada do destinatário.
- Use pergunta direta (ex: perguntar disponibilidade na semana) ou convite objetivo pra uma call breve.
- Não use CTA vago tipo "fico à disposição" ou "se fizer sentido, podemos marcar" sem propor a ação seguinte de forma concreta.
- Não ofereça horários específicos nem invente disponibilidade — peça a disponibilidade do destinatário, não determine um horário fixo.
- Esta seção também está subordinada à HIERARQUIA DE RESPOSTA — nenhum CTA pode violar restrição do CONTEXTO DO CLIENTE.

FORMATO:
- Corpo do e-mail pronto para colar.
- Não adicionar explicações antes do texto.
- Não adicionar comentários depois do texto.
- Assinatura real ao final quando existir.
`.trim()

function buildPromptText({ emailText, signature, clientContext, referenceBlock, hasImages }) {
  return `
### ASSINATURA
Use esta assinatura real ao final da resposta, se estiver disponível. Nunca invente placeholders.

${signature || '[não informada]'}

### CONTEXTO DO CLIENTE (PRIORIDADE MÁXIMA)
Informações reais combinadas com este cliente (questionário/kickoff), já resumidas por relevância comercial. Use como fonte de verdade sobre escopo, serviços, dores e acordos já feitos.

${clientContext || '[nenhum contexto de cliente informado]'}

### RESPOSTAS ANTERIORES SEMELHANTES (PRIORIDADE ALTA)
Respostas reais já enviadas pelo usuário para e-mails parecidos, da mais pra menos parecida.
Use como base principal de linguagem, tom e estrutura.

${referenceBlock || '[nenhuma resposta anterior semelhante informada]'}

### E-MAIL RECEBIDO
${hasImages ? '(ver também o(s) print(s) de tela anexado(s) — pode conter o e-mail inteiro ou parte dele)' : ''}

${emailText || (hasImages ? '[sem texto colado — ler o e-mail a partir do(s) print(s)]' : '[sem conteúdo]')}
`.trim()
}

// --- Sanitização de entrada (portado da API de produção) ---

function normalizeText(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\u0000/g, '')
    .trim()
}

function limitText(value, max) {
  const text = String(value || '').trim()
  return text.length > max ? text.slice(0, max) : text
}

function dedupeLines(text) {
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const seen = new Set()
  const out = []

  for (const line of lines) {
    const key = line.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(line)
  }

  return out.join('\n')
}

function sanitizeEmailBody(text, maxChars) {
  let clean = normalizeText(text)

  const historyPatterns = [
    /\n-{2,}\s*Mensagem encaminhada\s*-{2,}[\s\S]*$/i,
    /\n-{2,}\s*Forwarded message\s*-{2,}[\s\S]*$/i,
    /\nEm\s.+?escreveu:[\s\S]*$/i,
    /\nOn\s.+?wrote:[\s\S]*$/i,
    /\nDe:\s.+[\s\S]*$/i,
    /\nFrom:\s.+[\s\S]*$/i,
  ]

  for (const pattern of historyPatterns) {
    clean = clean.replace(pattern, '')
  }

  clean = clean
    .split('\n')
    .filter((line) => !line.trim().startsWith('>'))
    .join('\n')

  clean = clean
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const lower = line.toLowerCase()

      if (/^enviado do meu iphone$/i.test(lower)) return false
      if (/^sent from my iphone$/i.test(lower)) return false
      if (/^att[,]?$/i.test(lower)) return false
      if (/^best[,]?$/i.test(lower)) return false
      if (/^thanks[,]?$/i.test(lower)) return false

      return true
    })
    .join('\n')

  clean = dedupeLines(clean)
  clean = normalizeText(clean)

  return limitText(clean, maxChars)
}

function sanitizeSupportText(text, maxChars) {
  let clean = normalizeText(text)

  clean = clean
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const lower = line.toLowerCase()

      if (lower.length < 4) return false
      if (/^página\s+\d+/i.test(lower)) return false
      if (/^page\s+\d+/i.test(lower)) return false
      if (/^[^a-zà-ú0-9]+$/i.test(lower)) return false
      if (/^www\./i.test(lower)) return false
      if (/^http/i.test(lower)) return false

      return true
    })
    .join('\n')

  clean = dedupeLines(clean)
  clean = normalizeText(clean)

  return limitText(clean, maxChars)
}

function pickLinesByKeywords(lines, keywords, maxItems) {
  const out = []
  const seen = new Set()

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (!keywords.some((k) => lower.includes(k))) continue

    const key = lower.trim()
    if (seen.has(key)) continue
    seen.add(key)

    out.push(line)
    if (out.length >= maxItems) break
  }

  return out
}

// Reduz o contexto do cliente a POSICIONAMENTO / DORES / SOLUÇÕES pontuando linhas
// por palavra-chave comercial — mesma lógica de buildCommercialReference da API.
function buildCommercialReference(reference, maxChars) {
  const text = normalizeText(reference)
  if (!text) return ''

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const strongKeywords = [
    'crm', 'kommo', 'lead', 'leads', 'tráfego', 'trafego', 'landing page', 'site',
    'automação', 'automacoes', 'automações', 'follow-up', 'follow up', 'cadência',
    'cadencia', 'conversão', 'conversao', 'vendas', 'comercial', 'funil', 'dashboard',
    'atendimento', 'no-show', 'previsibilidade', 'faturamento', 'meta ads', 'google ads',
    'pré-vendas', 'pre-vendas', 'pré vendas', 'social media', 'instagram', 'marketing',
    'tráfego pago', 'trafego pago', 'landing pages', 'operação', 'operacao',
  ]

  const weighted = lines.map((line) => {
    const lower = line.toLowerCase()
    let score = 0

    for (const keyword of strongKeywords) {
      if (lower.includes(keyword)) score += 3
    }

    if (/\br\$\s?\d+/i.test(line)) score += 1
    if (/plano/i.test(line)) score += 1
    if (/problema/i.test(line)) score += 2
    if (/resolver/i.test(line)) score += 2
    if (/resultado/i.test(line)) score += 1
    if (/crescimento/i.test(line)) score += 2
    if (/gestão/i.test(line) || /gestao/i.test(line)) score += 2

    if (line.length > 220) score -= 1
    if (line.length < 10) score -= 1

    return { line, score }
  })

  const selected = weighted
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 60)
    .map((item) => item.line)

  let summary = selected.join('\n')
  summary = dedupeLines(summary)
  summary = normalizeText(summary)

  if (!summary) {
    summary = limitText(text, maxChars)
  }

  const finalBlocks = []

  const positioningBlock = pickLinesByKeywords(
    selected,
    ['marketing', 'crm', 'atendimento', 'crescimento', 'comercial', 'vendas'],
    8
  )

  const painBlock = pickLinesByKeywords(
    selected,
    [
      'baixo volume', 'dependência', 'dependencia', 'leads inconsistentes', 'previsibilidade',
      'no-show', 'cadência', 'cadencia', 'falta de controle', 'atendimento lento',
      'follow-up', 'follow up', 'faturamento',
    ],
    8
  )

  const solutionBlock = pickLinesByKeywords(
    selected,
    [
      'crm', 'kommo', 'automação', 'automações', 'automacoes', 'tráfego', 'trafego',
      'landing page', 'landing pages', 'site', 'dashboard', 'funil', 'atendimento',
      'pré-vendas', 'pre-vendas', 'social media', 'google ads', 'meta ads',
    ],
    12
  )

  if (positioningBlock.length) {
    finalBlocks.push('POSICIONAMENTO:\n' + positioningBlock.join('\n'))
  }

  if (painBlock.length) {
    finalBlocks.push('DORES QUE A ATIVA.AI AJUDA A RESOLVER:\n' + painBlock.join('\n'))
  }

  if (solutionBlock.length) {
    finalBlocks.push('SOLUÇÕES E FRENTES DE ATUAÇÃO:\n' + solutionBlock.join('\n'))
  }

  const finalText = normalizeText(finalBlocks.join('\n\n') || summary)
  return limitText(finalText, maxChars)
}

// --- Pós-processamento de saída (portado da API de produção) ---

function cleanupFinalEmail(text) {
  return normalizeText(text)
    .replace(/^\s*assunto:\s.*$/gim, '')
    .replace(/^\s*classificação:\s.*$/gim, '')
    .replace(/^\s*classificacao:\s.*$/gim, '')
    .replace(/^\s*categoria:\s.*$/gim, '')
    .replace(/^\s*análise:\s.*$/gim, '')
    .replace(/^\s*analise:\s.*$/gim, '')
    .trim()
}

async function generateReply({ emailText, signature, clientContext, referenceBlock, images }) {
  const imageList = images || []

  const cleanEmailText = sanitizeEmailBody(emailText, 12000)
  const cleanSignature = sanitizeSupportText(signature, 4000)
  const cleanClientContext = buildCommercialReference(sanitizeSupportText(clientContext, 20000), 8000)
  const cleanReferenceBlock = sanitizeSupportText(referenceBlock, 8000)

  const promptText = buildPromptText({
    emailText: cleanEmailText,
    signature: cleanSignature,
    clientContext: cleanClientContext,
    referenceBlock: cleanReferenceBlock,
    hasImages: imageList.length > 0,
  })

  const content = [{ type: 'input_text', text: promptText }]
  for (const image of imageList) {
    content.push({
      type: 'input_image',
      image_url: `data:${image.mimeType};base64,${image.base64}`,
    })
  }

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({
      model: CHAT_MODEL,
      instructions: SYSTEM_INSTRUCTIONS,
      input: [{ role: 'user', content }],
      max_output_tokens: 700,
    }),
  })

  const rawText = await res.text()
  let data = null
  try {
    data = rawText ? JSON.parse(rawText) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new OpenAiError(data?.error?.message || `Erro da OpenAI (${res.status})`)
  }

  const text = data?.output_text?.trim() || extractTextFromResponse(data)
  if (!text) throw new OpenAiError('A OpenAI respondeu sem texto final')
  return cleanupFinalEmail(text)
}

function extractTextFromResponse(data) {
  try {
    const texts = []
    for (const item of data?.output ?? []) {
      for (const content of item?.content ?? []) {
        if (content?.type === 'output_text' && content?.text) texts.push(content.text)
      }
    }
    return texts.join('\n').trim()
  } catch {
    return ''
  }
}

module.exports = { generateReply, OpenAiError }
