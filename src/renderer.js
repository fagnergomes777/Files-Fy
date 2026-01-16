const wizardEl = document.getElementById('wizard')
const stepIndicatorEl = document.getElementById('step-indicator')

let currentStep = 1
let devices = []
let selectedDevice = null
let selectedFileType = 'todos'
let scanResults = []
let selectedFiles = []

function setStep(step) {
  currentStep = step
  stepIndicatorEl.textContent = step
  renderStep()
}

function renderStep() {
  if (currentStep === 1) return renderWelcome()
  if (currentStep === 2) return renderSelectDevice()
  if (currentStep === 3) return renderSelectType()
  if (currentStep === 4) return renderScan()
  if (currentStep === 5) return renderResults()
}

function renderWelcome() {
  wizardEl.innerHTML = `
    <section class="step step-welcome">
      <h2>Bem-vindo</h2>
      <p>Vamos recuperar seus arquivos apagados ou perdidos. O processo é simples e guiado.</p>
      <button class="btn-primary" id="btn-start">Começar recuperação</button>
    </section>
  `
  document.getElementById('btn-start').onclick = () => setStep(2)
}

async function renderSelectDevice() {
  wizardEl.innerHTML = `
    <section class="step step-device">
      <h2>Escolha o dispositivo</h2>
      <p>Selecione o HD ou pendrive onde os arquivos foram apagados.</p>
      <div id="device-list" class="card-list">Carregando dispositivos...</div>
      <div class="step-actions">
        <button class="btn-secondary" id="btn-back">Voltar</button>
        <button class="btn-primary" id="btn-next" disabled>Próximo</button>
      </div>
    </section>
  `
  document.getElementById('btn-back').onclick = () => setStep(1)

  const deviceListEl = document.getElementById('device-list')

  try {
    devices = await window.electronAPI.listDevices()
    if (!devices || devices.length === 0) {
      deviceListEl.textContent = 'Nenhum dispositivo encontrado. Conecte um pendrive ou HD e tente novamente.'
      return
    }

    deviceListEl.innerHTML = devices.map(d => `
      <div class="card device-card" data-id="${d.id}">
        <h3>${d.label}</h3>
        <p>${d.type} • ${d.size}</p>
      </div>
    `).join('')

    const cards = deviceListEl.querySelectorAll('.device-card')
    cards.forEach(card => {
      card.onclick = () => {
        cards.forEach(c => c.classList.remove('selected'))
        card.classList.add('selected')
        selectedDevice = card.getAttribute('data-id')
        document.getElementById('btn-next').disabled = false
      }
    })

    document.getElementById('btn-next').onclick = () => setStep(3)
  } catch (err) {
    deviceListEl.textContent = 'Erro ao listar dispositivos.'
    console.error(err)
  }
}

function renderSelectType() {
  wizardEl.innerHTML = `
    <section class="step step-type">
      <h2>Tipo de arquivo</h2>
      <p>Escolha o que você deseja recuperar. Você pode alterar isso depois.</p>
      <div class="card-list">
        <div class="card type-card" data-type="todos">Todos os arquivos</div>
        <div class="card type-card" data-type="fotos">Fotos</div>
        <div class="card type-card" data-type="videos">Vídeos</div>
        <div class="card type-card" data-type="musicas">Músicas</div>
        <div class="card type-card" data-type="documentos">Documentos</div>
      </div>
      <div class="step-actions">
        <button class="btn-secondary" id="btn-back">Voltar</button>
        <button class="btn-primary" id="btn-next">Iniciar busca</button>
      </div>
    </section>
  `
  document.getElementById('btn-back').onclick = () => setStep(2)

  const cards = document.querySelectorAll('.type-card')
  cards.forEach(card => {
    if (card.getAttribute('data-type') === selectedFileType) {
      card.classList.add('selected')
    }
    card.onclick = () => {
      cards.forEach(c => c.classList.remove('selected'))
      card.classList.add('selected')
      selectedFileType = card.getAttribute('data-type')
    }
  })

  document.getElementById('btn-next').onclick = () => setStep(4)
}

async function renderScan() {
  wizardEl.innerHTML = `
    <section class="step step-scan">
      <h2>Buscando arquivos</h2>
      <p>Isso pode levar alguns minutos, dependendo do tamanho do dispositivo.</p>
      <div class="progress-bar">
        <div class="progress-inner" id="scan-progress" style="width: 0%"></div>
      </div>
      <p id="scan-status">Iniciando...</p>
      <div class="step-actions">
        <button class="btn-secondary" id="btn-back" disabled>Voltar</button>
      </div>
    </section>
  `
  document.getElementById('btn-back').onclick = () => {}

  try {
    document.getElementById('scan-status').textContent = 'Procurando arquivos...'
    const result = await window.electronAPI.startScan(selectedDevice, selectedFileType)
    scanResults = result.files || []
    document.getElementById('scan-progress').style.width = (result.progress || 100) + '%'
    document.getElementById('scan-status').textContent = `${scanResults.length} arquivos encontrados.`
    setTimeout(() => setStep(5), 800)
  } catch (err) {
    document.getElementById('scan-status').textContent = 'Erro durante a busca.'
    console.error(err)
  }
}

function renderResults() {
  selectedFiles = []
  wizardEl.innerHTML = `
    <section class="step step-results">
      <h2>Arquivos encontrados</h2>
      <p>Selecione os arquivos que deseja recuperar e escolha a pasta de destino.</p>

      <div class="results-header">
        <span>${scanResults.length} arquivos encontrados</span>
      </div>

      <div class="results-list">
        ${scanResults.map(file => `
          <label class="result-item">
            <input type="checkbox" class="file-checkbox" data-id="${file.id}">
            <div class="result-info">
              <span class="file-name">${file.name}</span>
              <span class="file-meta">${file.type} • ${file.size} • ${file.status}</span>
              <span class="file-path">${file.path}</span>
            </div>
          </label>
        `).join('')}
      </div>

      <div class="step-actions">
        <button class="btn-secondary" id="btn-back">Voltar</button>
        <button class="btn-primary" id="btn-recover">Recuperar selecionados</button>
      </div>
    </section>
  `
  document.getElementById('btn-back').onclick = () => setStep(3)

  const checkboxes = document.querySelectorAll('.file-checkbox')
  checkboxes.forEach(cb => {
    cb.onchange = () => {
      const id = parseInt(cb.getAttribute('data-id'), 10)
      if (cb.checked) {
        const file = scanResults.find(f => f.id === id)
        if (file && !selectedFiles.includes(file)) {
          selectedFiles.push(file)
        }
      } else {
        selectedFiles = selectedFiles.filter(f => f.id !== id)
      }
    }
  })

  document.getElementById('btn-recover').onclick = handleRecover
}

async function handleRecover() {
  if (!selectedFiles.length) {
    alert('Selecione pelo menos um arquivo para recuperar.')
    return
  }

  const destination = await window.electronAPI.chooseDestination()
  if (!destination) {
    return
  }

  const result = await window.electronAPI.recoverFiles(selectedFiles, destination)

  wizardEl.innerHTML = `
    <section class="step step-summary">
      <h2>Recuperação concluída</h2>
      <p>${result.recovered} arquivos recuperados com sucesso para:</p>
      <p class="path-destination">${destination}</p>
      <div class="step-actions">
        <button class="btn-primary" id="btn-new">Nova recuperação</button>
      </div>
    </section>
  `
  document.getElementById('btn-new').onclick = () => {
    selectedDevice = null
    selectedFileType = 'todos'
    scanResults = []
    selectedFiles = []
    setStep(1)
  }
}

renderStep()
