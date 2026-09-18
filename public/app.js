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

  loadSignature()
  checkSession()
  startWireClock()
})()
