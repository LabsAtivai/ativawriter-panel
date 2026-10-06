(function () {
  const SIGNATURE_KEY = 'ativawriter:signature'

  const loginScreen = document.getElementById('login-screen')
  const appScreen = document.getElementById('app-screen')
  const loginForm = document.getElementById('login-form')
  const loginPassword = document.getElementById('login-password')
  const loginError = document.getElementById('login-error')
  const logoutBtn = document.getElementById('logout-btn')

  const dropzone = document.getElementById('dropzone')
  const imagesInput = document.getElementById('images-input')
  const imagePreviewList = document.getElementById('image-preview-list')
  const emailText = document.getElementById('email-text')
  const signature = document.getElementById('signature')
  const clientContext = document.getElementById('client-context')
  const referenceBlock = document.getElementById('reference-block')

  const contextFileInput = document.getElementById('context-file-input')
  const contextFileChip = document.getElementById('context-file-chip')
  const contextFileName = document.getElementById('context-file-name')
  const contextFileRemove = document.getElementById('context-file-remove')

  const generateBtn = document.getElementById('generate-btn')
  const clearBtn = document.getElementById('clear-btn')
  const generateStatus = document.getElementById('generate-status')
  const generateError = document.getElementById('generate-error')

  const resultPanel = document.getElementById('result-panel')
  const resultText = document.getElementById('result-text')
  const copyBtn = document.getElementById('copy-btn')
  const copyFeedback = document.getElementById('copy-feedback')
  const wireClock = document.getElementById('wire-clock')

  /** @type {File[]} */
  let images = []
  /** @type {File|null} */
  let contextFile = null

  function showScreen(authenticated) {
    loginScreen.hidden = authenticated
    appScreen.hidden = !authenticated
  }

  function setError(el, message) {
    if (!message) {
      el.hidden = true
      el.textContent = ''
      return
    }
    el.hidden = false
    el.textContent = message
  }

  async function checkSession() {
    try {
      const res = await fetch('/api/session')
      const data = await res.json()
      showScreen(!!data.authenticated)
    } catch {
      showScreen(false)
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    setError(loginError, '')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword.value }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(loginError, data.error || 'Não foi possível entrar')
        return
      }
      loginPassword.value = ''
      showScreen(true)
    } catch {
      setError(loginError, 'Erro de conexão. Tente de novo.')
    }
  })

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' })
    showScreen(false)
  })

  function renderPreviews() {
    imagePreviewList.innerHTML = ''
    images.forEach((file, index) => {
      const wrapper = document.createElement('div')
      wrapper.className = 'image-preview'

      const clip = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      clip.setAttribute('class', 'icon icon-clip')
      clip.setAttribute('aria-hidden', 'true')
      clip.innerHTML = '<use href="#icon-clip"/>'
      wrapper.appendChild(clip)

      const img = document.createElement('img')
      img.src = URL.createObjectURL(file)
      wrapper.appendChild(img)

      const removeBtn = document.createElement('button')
      removeBtn.type = 'button'
      removeBtn.className = 'remove-btn'
      removeBtn.setAttribute('aria-label', 'Remover print')
      removeBtn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#icon-x"/></svg>'
      removeBtn.addEventListener('click', () => {
        images.splice(index, 1)
        renderPreviews()
      })
      wrapper.appendChild(removeBtn)

      imagePreviewList.appendChild(wrapper)
    })
  }

  function addImages(fileList) {
    for (const file of fileList) {
      if (file.type.startsWith('image/')) images.push(file)
    }
    renderPreviews()
  }

  imagesInput.addEventListener('change', () => {
    addImages(imagesInput.files)
    imagesInput.value = ''
  })

  function setContextFile(file) {
    contextFile = file
    contextFileChip.hidden = !file
    contextFileName.textContent = file ? file.name : ''
  }

  contextFileInput.addEventListener('change', () => {
    const file = contextFileInput.files?.[0]
    if (file) setContextFile(file)
    contextFileInput.value = ''
  })

  contextFileRemove.addEventListener('click', () => setContextFile(null))

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropzone.classList.add('dragover')
  })
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'))
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault()
    dropzone.classList.remove('dragover')
    if (e.dataTransfer?.files?.length) addImages(e.dataTransfer.files)
  })

  document.addEventListener('paste', (e) => {
    if (appScreen.hidden) return
    const items = e.clipboardData?.items
    if (!items) return
    const pasted = []
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) pasted.push(file)
      }
    }
    if (pasted.length) addImages(pasted)
  })

  function loadSignature() {
    const saved = localStorage.getItem(SIGNATURE_KEY)
    if (saved) signature.value = saved
  }

  signature.addEventListener('input', () => {
    localStorage.setItem(SIGNATURE_KEY, signature.value)
  })

  function resetForm() {
    images = []
    renderPreviews()
    setContextFile(null)
    emailText.value = ''
    clientContext.value = ''
    referenceBlock.value = ''
    resultPanel.hidden = true
    resultText.value = ''
    setError(generateError, '')
    generateStatus.textContent = ''
  }

  clearBtn.addEventListener('click', resetForm)

  generateBtn.addEventListener('click', async () => {
    setError(generateError, '')
    if (!images.length && !emailText.value.trim()) {
      setError(generateError, 'Cole ao menos um print ou o texto do e-mail.')
      return
    }

    generateBtn.disabled = true
    generateStatus.textContent = 'TRANSMITINDO'
    resultPanel.hidden = true

    try {
      const formData = new FormData()
      formData.append('emailText', emailText.value)
      formData.append('signature', signature.value)
      formData.append('clientContext', clientContext.value)
      formData.append('referenceBlock', referenceBlock.value)
      images.forEach((file) => formData.append('images', file))
      if (contextFile) formData.append('contextFile', contextFile)

      const res = await fetch('/api/generate-reply', { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(generateError, data.error || 'Erro ao gerar resposta')
        return
      }

      resultText.value = data.response || ''
      resultPanel.hidden = false
    } catch {
      setError(generateError, 'Erro de conexão. Tente de novo.')
    } finally {
      generateBtn.disabled = false
      generateStatus.textContent = ''
    }
  })

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(resultText.value)
      copyFeedback.textContent = 'COPIADO'
      setTimeout(() => (copyFeedback.textContent = ''), 2000)
    } catch {
      copyFeedback.textContent = 'Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.'
    }
  })

  function startWireClock() {
    if (!wireClock) return
    const tick = () => {
      const now = new Date()
      const text = now.toLocaleTimeString('pt-BR', { hour12: false })
      wireClock.textContent = text
      wireClock.setAttribute('datetime', now.toISOString())
    }
    tick()
    setInterval(tick, 1000)
  }

  // ---- abas ----
  const desk = document.querySelector('.desk')
  const tabButtons = document.querySelectorAll('.tab-btn')
  const tabPanels = {
    despacho: document.getElementById('tab-despacho'),
    negativacao: document.getElementById('tab-negativacao'),
  }
  let negTimer = null

  function selectTab(name) {
    tabButtons.forEach((btn) => {
      const active = btn.dataset.tab === name
      btn.classList.toggle('is-active', active)
      btn.setAttribute('aria-selected', String(active))
    })
    Object.entries(tabPanels).forEach(([key, el]) => (el.hidden = key !== name))
    desk.dataset.tab = name
    clearInterval(negTimer)
    if (name === 'negativacao') {
      loadRuns()
      negTimer = setInterval(loadRuns, 10000)
    }
  }
  tabButtons.forEach((btn) => btn.addEventListener('click', () => selectTab(btn.dataset.tab)))

  // ---- negativação ----
  const negForm = document.getElementById('neg-form')
  const negValue = document.getElementById('neg-value')
  const negSubmit = document.getElementById('neg-submit')
  const negError = document.getElementById('neg-error')
  const negOk = document.getElementById('neg-ok')
  const negRuns = document.getElementById('neg-runs')
  const negEmpty = document.getElementById('neg-empty')
  let openRunId = null

  const STATUS_LABEL = { running: 'Em andamento', completed: 'Concluída', failed: 'Falhou' }

  // O painel grava em UTC (datetime('now') do SQLite, sem fuso).
  function formatWhen(value) {
    const date = new Date(String(value).replace(' ', 'T') + 'Z')
    return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  }

  function renderDetail(container, run) {
    container.textContent = ''
    if (run.error) {
      const p = document.createElement('p')
      p.textContent = run.error
      container.appendChild(p)
    }
    const results = run.account_results || []
    if (!results.length) {
      const p = document.createElement('p')
      p.textContent = 'Sem resultados por conta ainda.'
      container.appendChild(p)
      return
    }
    const table = document.createElement('table')
    const head = table.createTHead().insertRow()
    for (const label of ['Conta Snov.io', 'Lista', 'Enviados', 'Duplicados', 'Falhas']) {
      const th = document.createElement('th')
      th.textContent = label
      head.appendChild(th)
    }
    const body = table.createTBody()
    for (const r of results) {
      const row = body.insertRow()
      for (const cell of [r.account_label, r.list_id, r.added, r.duplicates, r.error || r.failed]) {
        row.insertCell().textContent = cell ?? ''
      }
    }
    container.appendChild(table)
  }

  async function loadDetail(id, container) {
    try {
      const res = await fetch('/api/negativacao/runs/' + id)
      if (res.ok) renderDetail(container, await res.json())
    } catch {
      /* mantém o que já está na tela */
    }
  }

  function renderRuns(runs) {
    negRuns.textContent = ''
    negEmpty.hidden = runs.length > 0
    runs.forEach((run) => {
      const li = document.createElement('li')
      li.className = 'neg-run'

      const head = document.createElement('button')
      head.type = 'button'
      head.className = 'neg-run-head'
      head.setAttribute('aria-expanded', String(openRunId === run.id))

      const value = document.createElement('span')
      value.className = 'neg-run-value'
      value.textContent = run.value
      const when = document.createElement('span')
      when.className = 'neg-run-when'
      when.textContent = formatWhen(run.started_at)
      const status = document.createElement('span')
      status.className = 'neg-status neg-status--' + run.status
      status.textContent = STATUS_LABEL[run.status] || run.status
      head.append(value, when, status)
      li.appendChild(head)

      const detail = document.createElement('div')
      detail.className = 'neg-run-detail'
      detail.hidden = openRunId !== run.id
      li.appendChild(detail)
      if (openRunId === run.id) loadDetail(run.id, detail)

      head.addEventListener('click', () => {
        openRunId = openRunId === run.id ? null : run.id
        renderRuns(runs)
      })
      negRuns.appendChild(li)
    })
  }

  async function loadRuns() {
    try {
      const res = await fetch('/api/negativacao/runs')
      if (res.status === 401) return showScreen(false)
      if (res.ok) renderRuns(await res.json())
    } catch {
      /* painel fora do ar: mantém a lista anterior */
    }
  }

  negForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    setError(negError, '')
    negOk.hidden = true
    const value = negValue.value.trim()
    if (!value) return

    negSubmit.disabled = true
    try {
      const res = await fetch('/api/negativacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(negError, data.error || 'Erro ao negativar')
        return
      }
      negValue.value = ''
      negOk.hidden = false
      negOk.textContent = 'NEGATIVAÇÃO INICIADA'
      setTimeout(() => (negOk.hidden = true), 4000)
      setTimeout(loadRuns, 1500)
    } catch {
      setError(negError, 'Erro de conexão. Tente de novo.')
    } finally {
      negSubmit.disabled = false
    }
  })

  loadSignature()
  checkSession()
  startWireClock()
})()
