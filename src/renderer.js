// Elementos DOM
const wizardEl = document.getElementById('wizard');
const logoutBtn = document.getElementById('logout-btn');
const userInfoEl = document.getElementById('user-info');
// Footer element removed - new footer structure in place

// Estado da aplicação
let currentStep = 0;
let devices = [];
let selectedDevice = null;
let selectedFileType = 'todos';
let scanResults = [];
let selectedFiles = [];
let currentUser = null;
let userSubscription = null;
let selectedPlan = null;
let currentFilter = null; // 'free' ou 'pro'

// Planos e features
const PLANS = {
  free: {
    name: 'Filesfy FREE',
    price: 'Grátis',
    originalPrice: null,
    discount: null,
    duration: 'Para sempre',
    button: 'Começar Grátis',
    features: [
      { name: 'Até 3 varridas por mês', included: true },
      { name: 'Limite 100MB por varredura', included: true },
      { name: 'Máximo 5 arquivos', included: true },
      { name: 'Recuperação básica', included: true },
      { name: 'Suporte por email', included: true },
      { name: 'Histórico 7 dias', included: true },
      { name: 'Sem anúncios', included: true },
      { name: 'Armazenamento 500MB', included: true },
      { name: 'Varreduras ilimitadas', included: false },
      { name: 'Sem limite de arquivos', included: false }
    ]
  },
  pro: {
    name: 'Filesfy PRO',
    price: 'R$ 9,99',
    originalPrice: 'R$ 15,99',
    discount: '37%',
    duration: 'primeiro mês',
    button: 'Fazer Upgrade PRO',
    features: [
      { name: 'Até 3 varridas por mês', included: true },
      { name: 'Limite 100MB por varredura', included: true },
      { name: 'Máximo 5 arquivos', included: true },
      { name: 'Recuperação básica', included: true },
      { name: 'Suporte por email', included: true },
      { name: 'Histórico 7 dias', included: true },
      { name: 'Sem anúncios', included: true },
      { name: 'Armazenamento 500MB', included: true },
      { name: 'Varreduras ilimitadas', included: true },
      { name: 'Sem limite de arquivos', included: true }
    ]
  }
};

// Event listeners
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    if (typeof authManager !== 'undefined') {
      await authManager.logout();
      location.reload();
    }
  });
}

// Detectar mudanças de autenticação
window.addEventListener('authChanged', (e) => {
  currentUser = e.detail.user;
  updateHeader();
  if (currentUser) {
    loadUserSubscription();
  } else {
    showPlansComparison();
  }
});

// Inicializar app
document.addEventListener('DOMContentLoaded', () => {
  if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
    currentUser = authManager.getUser();
    selectedPlan = authManager.getPlan();
    updateHeader();
    loadUserSubscription();
  } else {
    showPlansComparison();
  }
});

function updateHeader() {
  if (currentUser && userInfoEl) {
    userInfoEl.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'block';
    userInfoEl.innerHTML = `
      <img src="${currentUser.avatar_url || currentUser.avatar}" alt="${currentUser.name}" class="user-avatar">
      <span>${currentUser.name} (${userSubscription?.plan_type || 'CARREGANDO...'})</span>
    `;
  } else {
    if (userInfoEl) userInfoEl.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

async function loadUserSubscription() {
  try {
    if (typeof ApiClient !== 'undefined' && currentUser) {
      const response = await ApiClient.getSubscription(currentUser.id);
      userSubscription = response.subscription;
      selectedPlan = response.subscription.plan_type;
      updateHeader();
    }
  } catch (error) {
    console.error('Erro ao carregar assinatura:', error);
  }
}

function showPlansComparison() {
  currentFilter = null;
  
  const html = `
    <div class="plans-container">
      <div class="plans-header">
        <h1>Escolha seu Plano</h1>
        <p>Selecione FREE para começar ou upgrade para PRO</p>
        
        <div class="filter-buttons">
          <button class="filter-btn active" onclick="filterPlan('free')">
            <span>FREE</span>
            <small>Visualizar</small>
          </button>
          <button class="filter-btn" onclick="filterPlan('pro')">
            <span>PRO</span>
            <small>Visualizar</small>
          </button>
        </div>
      </div>

      <div class="plans-grid">
        <div class="plan-card free-card">
          <div class="plan-badge">Plano Básico</div>
          <h2>${PLANS.free.name}</h2>
          
          <div class="plan-pricing">
            <span class="price">${PLANS.free.price}</span>
            <span class="duration">${PLANS.free.duration}</span>
          </div>

          <button class="btn-free" onclick="selectFreePlan()">
            ${PLANS.free.button}
          </button>

          <div class="plan-features">
            ${PLANS.free.features.map(f => `
              <div class="feature-item ${f.included ? 'included' : 'excluded'}">
                <span class="feature-icon">${f.included ? '✓' : '✗'}</span>
                <span class="feature-name">${f.name}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="plan-card pro-card">
          <div class="plan-badge-pro">Mais Popular</div>
          <h2>${PLANS.pro.name}</h2>
          
          <div class="plan-pricing">
            ${PLANS.pro.originalPrice ? `<span class="original-price">${PLANS.pro.originalPrice}</span>` : ''}
            <span class="price">${PLANS.pro.price}</span>
            ${PLANS.pro.discount ? `<span class="discount">${PLANS.pro.discount} desc.</span>` : ''}
            <span class="duration">${PLANS.pro.duration}</span>
          </div>

          <button class="btn-pro" onclick="selectProPlan()">
            ${PLANS.pro.button}
          </button>

          <div class="plan-features">
            ${PLANS.pro.features.map(f => `
              <div class="feature-item ${f.included ? 'included' : 'excluded'}">
                <span class="feature-icon">${f.included ? '✓' : '✗'}</span>
                <span class="feature-name">${f.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  
  wizardEl.innerHTML = html;
}

function filterPlan(planType) {
  currentFilter = planType;
  
  // Atualizar botões ativos
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.closest('.filter-btn').classList.add('active');
  
  // Animar cards
  const cards = document.querySelectorAll('.plan-card');
  cards.forEach(card => {
    if ((planType === 'free' && card.classList.contains('free-card')) ||
        (planType === 'pro' && card.classList.contains('pro-card'))) {
      card.style.opacity = '1';
      card.style.transform = 'scale(1)';
      card.style.pointerEvents = 'auto';
    } else {
      card.style.opacity = '0.5';
      card.style.transform = 'scale(0.95)';
      card.style.pointerEvents = 'none';
    }
  });
}

function selectFreePlan() {
  selectedPlan = 'free';
  currentUser = null;
  showHomePage();
}

function selectProPlan() {
  // Mostrar tela de autenticação para PRO
  currentStep = 0;
  selectedPlan = 'pro';
  
  const html = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Upgrade para PRO</h2>
          <p>Desbloquie recursos ilimitados</p>
        </div>

        <div class="auth-methods">
          <div id="google-signin-container"></div>
        </div>

        <div class="auth-benefits">
          <h3>Plano PRO Inclui:</h3>
          <ul>
            <li>✓ Varreduras ilimitadas</li>
            <li>✓ Recuperação de arquivos sem limite</li>
            <li>✓ Armazenamento 50GB</li>
            <li>✓ Suporte prioritário</li>
            <li>✓ Sem anúncios</li>
          </ul>
        </div>

        <button class="btn-back" onclick="showPlansComparison()">
          ← Voltar aos Planos
        </button>
      </div>
    </div>
  `;
  
  wizardEl.innerHTML = html;
  
  // Inicializar Google Sign-In se disponível
  setTimeout(() => {
    const container = document.getElementById('google-signin-container');
    if (container && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: document.querySelector('meta[name="google-client-id"]')?.content || 'YOUR_GOOGLE_CLIENT_ID',
        callback: handleGoogleProSignIn,
      });

      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'filled_blue',
        size: 'large',
        text: 'continue_with',
        width: '100%'
      });
    }
  }, 100);
}

async function handleGoogleProSignIn(response) {
  try {
    const { credential } = response;
    if (typeof authManager !== 'undefined') {
      await authManager.loginWithGoogle(credential, null);
      currentUser = authManager.getUser();
      selectedPlan = 'pro';
      updateHeader();
      loadUserSubscription();
      showPaymentPage();
    }
  } catch (error) {
    console.error('Erro no login:', error);
    
    if (error.error && error.error.includes('Google OAuth não está configurado')) {
      alert('⚠️ Google OAuth não configurado.\n\nSiga os passos em CONFIGURACAO_GOOGLE_OAUTH.md para configurar suas credenciais Google.');
    } else {
      alert('Erro ao fazer login com Google. Tente novamente.');
    }
  }
}

function showHomePage() {
  currentStep = 0;
  
  const planInfo = PLANS[selectedPlan];
  const isProUser = selectedPlan === 'pro' && currentUser;
  
  const html = `
    <div class="home-container">
      <div class="welcome-section">
        <h1>Bem-vindo ao Filesfy</h1>
        <p>${planInfo.name} - ${planInfo.price}</p>
      </div>

      <div class="plan-summary">
        <h3>Seu plano inclui:</h3>
        <div class="summary-grid">
          ${planInfo.features.filter(f => f.included).slice(0, 4).map(f => `
            <div class="summary-item">
              <span class="check">✓</span>
              <span>${f.name}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn-primary" onclick="renderSelectDevice()">
          📁 Iniciar Recuperação
        </button>
        ${selectedPlan === 'free' ? `
          <button class="btn-secondary" onclick="showPlansComparison()">
            ⭐ Fazer Upgrade para PRO
          </button>
        ` : ''}
      </div>

      <button class="btn-back" onclick="showPlansComparison()">
        ← Voltar aos Planos
      </button>
    </div>
  `;
  
  wizardEl.innerHTML = html;
}

function initGoogleSignIn() {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.initialize({
      client_id: document.querySelector('meta[name="google-client-id"]')?.content || 'YOUR_GOOGLE_CLIENT_ID',
      callback: handleGoogleSignIn,
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Renderizar button manualmente se prompt não aparecer
        const tempContainer = document.createElement('div');
        wizardEl.appendChild(tempContainer);
        window.google.accounts.id.renderButton(tempContainer, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with'
        });
      }
    });
  }
}

async function handleGoogleSignIn(response) {
  try {
    const { credential } = response;
    if (typeof authManager !== 'undefined') {
      await authManager.loginWithGoogle(credential, null);
      currentUser = authManager.getUser();
      selectedPlan = 'PRO';
      updateHeader();
      loadUserSubscription();
      
      // Se veio do upgrade, ir para pagamento
      if (currentStep === 0) {
        showPaymentPage();
      }
    }
  } catch (error) {
    console.error('Erro no login:', error);
    
    // Se houver mensagem sobre Google não configurado, mostrar instruções
    if (error.error && error.error.includes('Google OAuth não está configurado')) {
      alert('⚠️ Google OAuth não está configurado.\n\n1. Leia o arquivo CONFIGURACAO_GOOGLE_OAUTH.md\n2. Configure suas credenciais no arquivo .env\n3. Reinicie a aplicação\n\nEnquanto isso, use o modo TESTE para explorar a interface.');
    } else {
      alert('Erro ao fazer login. Verifique o console para mais detalhes.');
    }
  }
}

function showPaymentPage() {
  currentStep = 0;
  
  wizardEl.innerHTML = `
    <div class="payment-container">
      <div class="payment-header">
        <h2>Escolha a Forma de Pagamento</h2>
        <p>Clique em uma opção para continuar</p>
        <div class="payment-amount">
          <span>Total:</span>
          <strong>R$ 29,90</strong>
          <span class="payment-period">/mês</span>
        </div>
      </div>
      
      <div class="payment-methods">
        <div class="payment-option" data-method="pix">
          <svg class="payment-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
          <h3>PIX</h3>
          <p>Transferência instantânea</p>
        </div>
        
        <div class="payment-option" data-method="credit_card">
          <svg class="payment-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M20 8H4V6h16m0 10H4v-6h16m0-4H4c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
          </svg>
          <h3>Cartão de Crédito</h3>
          <p>Parcelado em até 12x</p>
        </div>
        
        <div class="payment-option" data-method="debit_card">
          <svg class="payment-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M20 8H4V6h16m0 10H4v-6h16m0-4H4c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
          </svg>
          <h3>Cartão de Débito</h3>
          <p>Débito em conta corrente</p>
        </div>
      </div>
      
      <button class="btn-cancel" id="btn-back-payment">
        Voltar
      </button>
    </div>
  `;
  
  // Event listeners para métodos de pagamento
  document.querySelectorAll('.payment-option').forEach(option => {
    option.addEventListener('click', () => {
      const method = option.dataset.method;
      processPayment(method);
    });
  });
  
  document.getElementById('btn-back-payment').addEventListener('click', () => {
    showPlansComparison();
  });
}

async function processPayment(method) {
  wizardEl.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <h2>Processando pagamento...</h2>
      <p>Por favor, aguarde</p>
    </div>
  `;
  
  try {
    // Simular processamento de pagamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Aqui você integra com Stripe/Mercado Pago
    if (typeof ApiClient !== 'undefined' && currentUser) {
      // Criar intent de pagamento
      const paymentIntent = await ApiClient.createPaymentIntent(
        currentUser.id,
        2990, // R$ 29,90 em centavos
        method
      );
      
      // Simular sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar assinatura
      await ApiClient.upgradePlan(currentUser.id, 'PRO');
      await loadUserSubscription();
      
      showPaymentSuccess();
    }
  } catch (error) {
    console.error('Erro no pagamento:', error);
    wizardEl.innerHTML = `
      <div class="error-container">
        <h2>Erro no Pagamento</h2>
        <p>${error.message || 'Não foi possível processar o pagamento'}</p>
        <button class="btn-primary" id="btn-retry-payment">
          Tentar Novamente
        </button>
      </div>
    `;
    
    document.getElementById('btn-retry-payment').addEventListener('click', () => {
      showPaymentPage();
    });
  }
}

function showPaymentSuccess() {
  wizardEl.innerHTML = `
    <div class="success-container">
      <svg class="success-icon" viewBox="0 0 24 24">
        <path fill="#22c55e" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <h2>Pagamento Realizado!</h2>
      <p>Sua assinatura PRO está ativa</p>
      <p class="success-details">Você agora tem acesso a todas as funcionalidades premium</p>
      
      <button class="btn-primary" id="btn-start-recovery-pro">
        Iniciar Recuperação
      </button>
    </div>
  `;
  
  document.getElementById('btn-start-recovery-pro').addEventListener('click', () => {
    selectedPlan = 'PRO';
    renderSelectDevice();
  });
}

function renderSelectDevice() {
  currentStep = 1;
  
  devices = [
    { id: 'hdd1', name: 'Disco Rígido Principal (C:)', size: '500GB' },
    { id: 'hdd2', name: 'Disco Rígido Secundário (D:)', size: '1TB' },
    { id: 'usb1', name: 'Pendrive Kingston', size: '32GB' },
    { id: 'external', name: 'HD Externo Seagate', size: '2TB' }
  ];
  
  let html = `
    <div class="step-container">
      <h2>Selecione um Dispositivo</h2>
      <div class="device-list">
  `;
  
  devices.forEach(device => {
    html += `
      <div class="device-card" data-device-id="${device.id}">
        <svg class="device-icon" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54h2.96l3.49-4.5-3.7-3.02-1.99 2.54-2.28-2.97H6.5l3.54 4.7-2.08 2.71h2.97z"/>
        </svg>
        <div class="device-info">
          <h3>${device.name}</h3>
          <p>${device.size}</p>
        </div>
        <svg class="device-arrow" viewBox="0 0 24 24">
          <path fill="currentColor" d="M8.59 16.58L10 18l6-6-6-6-1.41 1.41L13.17 11H4v2h9.17l-4.58 4.58z"/>
        </svg>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  wizardEl.innerHTML = html;
  updateFooter('Selecione um dispositivo', 1, 5);
  
  document.querySelectorAll('.device-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedDevice = card.dataset.deviceId;
      renderSelectType();
    });
  });
}

function renderSelectType() {
  currentStep = 2;
  
  const fileTypes = [
    { id: 'todos', name: 'Todos os Arquivos', icon: '📁', description: 'Recuperar todos os tipos de arquivo' },
    { id: 'imagens', name: 'Imagens', icon: '🖼️', description: 'Fotos, Screenshots, Imagens' },
    { id: 'videos', name: 'Vídeos', icon: '🎬', description: 'Vídeos em qualquer formato' },
    { id: 'docs', name: 'Documentos', icon: '📄', description: 'Word, PDF, Excel, PowerPoint' },
    { id: 'audio', name: 'Áudio', icon: '🎵', description: 'Músicas, Podcasts, Áudio' }
  ];
  
  let html = `
    <div class="step-container">
      <h2>Selecione o Tipo de Arquivo</h2>
      <div class="file-type-grid">
  `;
  
  fileTypes.forEach(type => {
    html += `
      <div class="file-type-card" data-type="${type.id}">
        <div class="file-type-icon">${type.icon}</div>
        <h3>${type.name}</h3>
        <p>${type.description}</p>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  wizardEl.innerHTML = html;
  updateFooter('Selecione o tipo de arquivo', 2, 5);
  
  document.querySelectorAll('.file-type-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedFileType = card.dataset.type;
      renderScan();
    });
  });
}

function renderScan() {
  currentStep = 3;
  let progress = 0;
  
  wizardEl.innerHTML = `
    <div class="step-container">
      <h2>Varrendo Dispositivo...</h2>
      <div class="scan-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%;"></div>
        </div>
        <p class="progress-text">0%</p>
        <p class="progress-details">Analisando setor ${selectedDevice}...</p>
      </div>
    </div>
  `;
  
  updateFooter('Varrendo dispositivo', 3, 5);
  
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 100) progress = 100;
    
    document.querySelector('.progress-fill').style.width = progress + '%';
    document.querySelector('.progress-text').textContent = Math.floor(progress) + '%';
    
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(renderResults, 800);
    }
  }, 400);
}

function renderResults() {
  currentStep = 4;
  
  // Gerar resultados mock
  scanResults = [
    { id: 1, name: 'Foto_Férias_2024.jpg', size: '4.2MB', type: 'image', canRecover: true },
    { id: 2, name: 'Vídeo_Aniversário.mp4', size: '512MB', type: 'video', canRecover: true },
    { id: 3, name: 'Documento_Importante.pdf', size: '2.1MB', type: 'document', canRecover: true },
    { id: 4, name: 'Planilha_2024.xlsx', size: '1.5MB', type: 'document', canRecover: true },
    { id: 5, name: 'Música_Favorita.mp3', size: '8.5MB', type: 'audio', canRecover: true },
    { id: 6, name: 'Apresentação.pptx', size: '15.3MB', type: 'document', canRecover: true },
    { id: 7, name: 'Código_Projeto.zip', size: '52.1MB', type: 'archive', canRecover: selectedPlan === 'PRO' },
    { id: 8, name: 'Backup_Database.sql', size: '128.5MB', type: 'document', canRecover: selectedPlan === 'PRO' }
  ];
  
  // Aplicar limite do plano FREE
  if (selectedPlan === 'FREE') {
    scanResults = scanResults.slice(0, 5);
  }
  
  selectedFiles = [];
  
  let html = `
    <div class="step-container">
      <h2>Arquivos Encontrados</h2>
      <div class="results-header">
        <button class="btn-small" id="btn-select-all">Selecionar Tudo</button>
        <span class="results-count">0 / ${scanResults.length} selecionados</span>
      </div>
      <div class="results-list">
  `;
  
  scanResults.forEach(file => {
    const disabled = !file.canRecover ? 'disabled' : '';
    html += `
      <div class="result-item ${disabled}" data-file-id="${file.id}">
        <input type="checkbox" class="file-checkbox" ${disabled}>
        <span class="file-icon">${getFileIcon(file.type)}</span>
        <div class="file-details">
          <p class="file-name">${file.name}</p>
          <p class="file-size">${file.size}</p>
          ${!file.canRecover ? '<p class="pro-feature">🔒 Apenas em PRO</p>' : ''}
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
      <button class="btn-primary" id="btn-recover">
        Recuperar Arquivos Selecionados
      </button>
    </div>
  `;
  
  wizardEl.innerHTML = html;
  updateFooter('Selecione os arquivos', 4, 5);
  
  const selectAllBtn = document.getElementById('btn-select-all');
  const checkboxes = document.querySelectorAll('.file-checkbox:not([disabled])');
  const resultsCount = document.querySelector('.results-count');
  
  selectAllBtn.addEventListener('click', () => {
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    updateFileSelection();
  });
  
  checkboxes.forEach((checkbox, index) => {
    checkbox.addEventListener('change', updateFileSelection);
  });
  
  function updateFileSelection() {
    selectedFiles = Array.from(checkboxes)
      .map((cb, i) => cb.checked ? scanResults[i].id : null)
      .filter(Boolean);
    resultsCount.textContent = `${selectedFiles.length} / ${scanResults.length} selecionados`;
  }
  
  document.getElementById('btn-recover').addEventListener('click', () => {
    if (selectedFiles.length === 0) {
      alert('Selecione pelo menos um arquivo');
      return;
    }
    recoverFiles();
  });
}

function getFileIcon(type) {
  const icons = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    document: '📄',
    archive: '📦'
  };
  return icons[type] || '📁';
}

function recoverFiles() {
  currentStep = 5;
  let progress = 0;
  
  wizardEl.innerHTML = `
    <div class="step-container">
      <h2>Recuperando Arquivos...</h2>
      <div class="recovery-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%;"></div>
        </div>
        <p class="progress-text">0%</p>
        <p class="progress-details">Recuperando ${selectedFiles.length} arquivo(s)...</p>
      </div>
    </div>
  `;
  
  updateFooter('Recuperando arquivos', 5, 5);
  
  const interval = setInterval(() => {
    progress += Math.random() * 12;
    if (progress > 100) progress = 100;
    
    document.querySelector('.progress-fill').style.width = progress + '%';
    document.querySelector('.progress-text').textContent = Math.floor(progress) + '%';
    
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(showRecoverySuccess, 800);
    }
  }, 300);
}

function showRecoverySuccess() {
  wizardEl.innerHTML = `
    <div class="success-container">
      <svg class="success-icon" viewBox="0 0 24 24">
        <path fill="#22c55e" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <h2>Recuperação Concluída!</h2>
      <p>${selectedFiles.length} arquivo(s) recuperado(s) com sucesso</p>
      <p class="success-details">Os arquivos foram salvos em C:\\Filesfy\\Recovered</p>
      
      <button class="btn-primary" id="btn-new-recovery">
        Iniciar Nova Recuperação
      </button>
      <button class="btn-secondary" id="btn-back-home">
        Voltar ao Início
      </button>
    </div>
  `;
  
  document.getElementById('btn-new-recovery').addEventListener('click', () => {
    renderSelectDevice();
  });
  
  document.getElementById('btn-back-home').addEventListener('click', () => {
    showHomePage();
  });
}

function updateFooter(text, current, total) {
  if (footerInfoEl) {
    footerInfoEl.innerHTML = `
      <span>${text}</span>
      <span class="step-counter">Passo ${current} de ${total}</span>
    `;
  }
}

// ===== Políticas e Documentos =====
function showModal(title, content) {
  const modal = `
    <div class="policy-modal" onclick="if(event.target.classList.contains('policy-modal')) event.target.remove()">
      <div class="policy-content">
        <div class="policy-header">
          <h2>${title}</h2>
          <button class="policy-close" onclick="event.target.closest('.policy-modal').remove()">&times;</button>
        </div>
        <div class="policy-body">
          ${content}
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

function showPrivacyPolicy(e) {
  e.preventDefault();
  const content = `
    <h3>1 — POLÍTICA DE PRIVACIDADE</h3>
    
    <h4>1.1 — Introdução</h4>
    <p>Esta Política de Privacidade estabelece os princípios e as diretrizes de tratamento de dados pessoais coletados, utilizados e armazenados pela Filesfy, em conformidade com a Lei Geral de Proteção de Dados – LGPD (Lei nº 13.709/2018).</p>
    
    <h4>1.2 — Dados Pessoais Coletados</h4>
    <p><strong>a. Dados de Identificação:</strong> Nome completo, CPF, Data de nascimento, Identificadores digitais (ex.: IDs do dispositivo)</p>
    <p><strong>b. Dados de Contato:</strong> Endereço de e-mail, Telefone, Endereço físico</p>
    <p><strong>c. Dados Técnicos:</strong> Endereço IP, Logs de sistema, Dados de uso e desempenho da aplicação</p>
    
    <h4>1.3 — Finalidades do Tratamento</h4>
    <ul>
      <li>Fornecer, manter, operar e melhorar o produto/serviço</li>
      <li>Cumprir obrigações legais ou regulatórias</li>
      <li>Comunicação com o usuário</li>
      <li>Suporte técnico e atendimento</li>
      <li>Análises estatísticas e melhoria contínua</li>
    </ul>
    
    <h4>1.4 — Bases Legais para Tratamento</h4>
    <p>O tratamento de dados é realizado com base nas bases legais da LGPD, tais como Consentimento, Execução de contrato, Cumprimento de obrigação legal e Legítimo interesse.</p>
    
    <h4>1.5 — Compartilhamento de Dados</h4>
    <p>Dados podem ser compartilhados com prestadores de serviços terceirizados, autoridades públicas quando exigido por lei, e parceiros comerciais com base legal apropriada.</p>
    
    <h4>1.6 — Armazenamento e Segurança</h4>
    <p>Os dados serão armazenados em ambiente seguro com criptografia em trânsito e em repouso, controle de acesso e logs de auditoria.</p>
    
    <h4>1.7 — Direitos dos Titulares de Dados</h4>
    <p>O usuário pode acessar, corrigir, revogar consentimento e solicitar anonimização ou eliminação de seus dados pessoais a qualquer tempo.</p>
  `;
  showModal('Política de Privacidade', content);
}

function showProductPolicy(e) {
  e.preventDefault();
  const content = `
    <h3>2 — POLÍTICA DE PRODUTO</h3>
    
    <h4>2.1 — Escopo</h4>
    <p>Esta política define regras de uso, responsabilidades, limites e garantias do produto de recuperação de dados fornecido pela Filesfy.</p>
    
    <h4>2.2 — Uso Adequado</h4>
    <p>O usuário concorda em utilizar o produto exclusivamente para recuperação de dados legítimos, fins lícitos e dentro da sua esfera de direitos, respeitando normas de privacidade e propriedade.</p>
    
    <h4>2.3 — Limitações Técnicas</h4>
    <p>O produto não garante:</p>
    <ul>
      <li>Recuperação integral após danos físicos severos</li>
      <li>Sucesso em mídias corrompidas além de capacidades técnicas</li>
      <li>Compatibilidade com todos os tipos de sistemas de arquivo</li>
    </ul>
    
    <h4>2.4 — Atualizações e Manutenção</h4>
    <p>Atualizações podem ser automáticas ou manuais. Os termos de atualização são regidos pelo Contrato de Licença de Uso.</p>
    
    <h4>2.5 — Suporte Técnico</h4>
    <p>O suporte será prestado conforme o plano contratado, com prazo de resposta definido e canais oficiais documentados.</p>
    
    <h4>2.6 — Responsabilidades</h4>
    <p><strong>Do fornecedor:</strong> Entregar o produto conforme a documentação e resguardar a segurança durante o uso.</p>
    <p><strong>Do usuário:</strong> Seguir instruções e boas práticas, não utilizar para atividades ilegais e resguardar acesso indevido.</p>
  `;
  showModal('Política de Produtos', content);
}

function showLicenseAgreement(e) {
  e.preventDefault();
  const content = `
    <h3>3 — CONTRATO DE LICENÇA DE USO</h3>
    
    <h4>CLÁUSULA 1 — OBJETO</h4>
    <p>O presente contrato tem por objeto a concessão de licença de uso, não exclusiva e não transferível, do software de recuperação de dados denominado Filesfy.</p>
    
    <h4>CLÁUSULA 2 — LICENÇA</h4>
    <p>A licença é pessoal, intransferível e válida pelo prazo contratado. O LICENCIADO não poderá:</p>
    <ul>
      <li>Alugar, sublicenciar, emprestar ou distribuir o software</li>
      <li>Descompilar ou fazer engenharia reversa</li>
      <li>Utilizar o software em desconformidade com a legislação vigente</li>
    </ul>
    
    <h4>CLÁUSULA 3 — PREÇO E PAGAMENTO</h4>
    <p>O LICENCIADO pagará à LICENCIANTE o valor contratado, conforme as condições de pagamento acordadas.</p>
    
    <h4>CLÁUSULA 4 — PRAZO E RESCISÃO</h4>
    <p>O contrato tem início na data de ativação. Pode ser rescindido por inadimplemento, pedido do LICENCIADO ou violação de termos de uso.</p>
    
    <h4>CLÁUSULA 5 — PROTEÇÃO DE DADOS (LGPD)</h4>
    <p>As partes concordam em tratar os dados pessoais conforme a LGPD. O LICENCIANTE implementará medidas de segurança técnicas e administrativas.</p>
    
    <h4>CLÁUSULA 6 — SUPORTE E ATUALIZAÇÕES</h4>
    <p>O LICENCIANTE fornecerá suporte conforme o plano selecionado e disponibilizará atualizações conforme política de versão.</p>
    
    <h4>CLÁUSULA 7 — GARANTIAS E LIMITAÇÕES</h4>
    <p>O software é fornecido "no estado em que se encontra". O LICENCIANTE não será responsável por perdas indiretas, danos consequenciais ou uso indevido.</p>
    
    <h4>CLÁUSULA 8 — LEI APLICÁVEL</h4>
    <p>Este contrato é regido pela legislação brasileira.</p>
  `;
  showModal('Contrato de Licença de Uso', content);
}

function showCookies(e) {
  e.preventDefault();
  const content = `
    <h3>PREFERÊNCIAS DE COOKIES</h3>
    <p>Cookies são pequenos arquivos de dados armazenados no seu dispositivo para melhorar sua experiência.</p>
    <p><strong>Tipos de Cookies utilizados:</strong></p>
    <ul>
      <li><strong>Essenciais:</strong> Necessários para o funcionamento da aplicação</li>
      <li><strong>Analíticos:</strong> Para medir desempenho e uso</li>
      <li><strong>Funcionais:</strong> Para lembrar suas preferências</li>
    </ul>
    <p>Você pode gerenciar suas preferências de cookies através das configurações do navegador.</p>
  `;
  showModal('Preferências de Cookies', content);
}

function showAbout(e) {
  e.preventDefault();
  const content = `
    <h3>SOBRE O FILESFY</h3>
    <p><strong>Filesfy - Recuperação de Dados</strong></p>
    <p><strong>Versão:</strong> 1.0.0</p>
    <p><strong>Descrição:</strong> Uma aplicação de desktop desenvolvida em Electron para recuperação segura e confiável de arquivos deletados.</p>
    <p><strong>Funcionalidades:</strong></p>
    <ul>
      <li>Recuperação de arquivos de diferentes tipos</li>
      <li>Suporte a múltiplos dispositivos de armazenamento</li>
      <li>Planos FREE e PRO com diferentes capacidades</li>
      <li>Autenticação segura com Google OAuth</li>
      <li>Sistema de pagamento integrado</li>
    </ul>
    <p><strong>© 2026 Filesfy Inc.</strong></p>
    <p>Todos os direitos reservados.</p>
  `;
  showModal('Sobre o Filesfy', content);
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof authManager !== 'undefined' && authManager.isAuthenticated && authManager.isAuthenticated()) {
      currentUser = authManager.getUser();
      selectedPlan = authManager.getPlan && authManager.getPlan() || 'FREE';
      updateHeader();
      loadUserSubscription();
    } else {
      showPlansComparison();
    }
  });
} else {
  if (typeof authManager !== 'undefined' && authManager.isAuthenticated && authManager.isAuthenticated()) {
    currentUser = authManager.getUser();
    selectedPlan = authManager.getPlan && authManager.getPlan() || 'FREE';
    updateHeader();
    loadUserSubscription();
  } else {
    showPlansComparison();
  }
}
