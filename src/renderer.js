const wizardEl = document.getElementById('wizard');
const logoutBtn = document.getElementById('logout-btn');
const userInfoEl = document.getElementById('user-info');
const footerInfoEl = document.querySelector('.footer-content .footer-left') || null;

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
let accessibilityState = {
  zoom: 1,
  contrast: false,
  hoverReading: false
};
let hoverReadHandler = null;
let lastSpokenText = '';
let lastSpeakTime = 0;
let accessibilityInitialized = false;
let accessMenuToggleEl = null;
let accessMenuPanelEl = null;
let isAccessPanelOpen = false;

const PLANS = {
  free: {
    name: 'Filesfy FREE',
    price: 'Grátis',
    originalPrice: null,
    discount: null,
    duration: 'Para sempre',
    button: 'Começar Grátis',
    features: [
      { name: 'Até 1 varridas por mês', included: true },
      { name: 'Limite 300MB por varredura', included: true },
      { name: 'Máximo 5 arquivos', included: true },
      { name: 'Recuperação básica', included: true },
      { name: 'Histórico 10 dias', included: true },
      { name: 'Com anúncios', included: true },
      { name: 'Armazenamento 300MB', included: true },
      { name: 'Varreduras ilimitadas', included: false },
      { name: 'Sem limite de arquivos', included: false },
      { name: 'Suporte por email', included: false },
    ]
  },
  pro: {
    name: 'Filesfy PRO',
    price: 'R$ 15,99',
    originalPrice: 'R$ 19,99',
    discount: '20%',
    duration: 'primeiro mês',
    button: 'Fazer Upgrade PRO',
    features: [
      { name: 'Até 5 varridas por mês', included: true },
      { name: 'Limite 1GB por varredura', included: true },
      { name: 'Máximo 10 arquivos', included: true },
      { name: 'Recuperação avançada', included: true },
      { name: 'Histórico 30 dias', included: true },
      { name: 'Sem anúncios', included: true },
      { name: 'Armazenamento 1GB', included: true },
      { name: 'Varreduras ilimitadas', included: true },
      { name: 'Sem limite de arquivos', included: true },
      { name: 'Suporte por email', included: true },
    ]
  }
};

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    if (typeof authManager !== 'undefined') {
      await authManager.logout();
      location.reload();
    }
  });
}

window.addEventListener('authChanged', (e) => {
  currentUser = e.detail.user;
  updateHeader();
  if (currentUser) {
    loadUserSubscription();
  } else {
    showPlansComparison();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Google Sign-In
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID',
      callback: handleGoogleSignIn
    });
  }
  
  initAccessibilityControls();
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
    const plan = currentUser.plan || currentUser.tipo_de_plano || userSubscription?.plan_type || 'FREE';
    userInfoEl.innerHTML = `
      <img src="${currentUser.avatar_url || currentUser.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name || currentUser.nome)}" alt="${currentUser.name || currentUser.nome}" class="user-avatar">
      <span>${currentUser.name || currentUser.nome} (${plan})</span>
    `;
  } else {
    if (userInfoEl) userInfoEl.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

async function loadUserSubscription() {
  try {
    if (currentUser) {
      userSubscription = {
        plan_type: currentUser.plan || currentUser.tipo_de_plano || 'FREE'
      };
      selectedPlan = userSubscription.plan_type.toLowerCase();
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
  showLoginPage('free');
}

function selectProPlan() {
  currentStep = 0;
  selectedPlan = 'pro';
  
  // Se já está autenticado, ir direto para pagamento
  if (currentUser && currentUser.id) {
    showPaymentPage();
    return;
  }
  
  // Caso contrário, mostrar tela de autenticação
  showLoginPage('pro');
}

function showLoginPage(planType = 'free') {
  currentStep = 0;
  selectedPlan = planType;
  
  const planInfo = PLANS[planType];
  const containerId = `google-login-container-${planType}`;
  const isOptional = planType === 'free';
  
  const html = `
    <div class="home-container">
      <div class="welcome-section">
        <h1>${planType === 'pro' ? 'Upgrade para PRO' : planInfo.name}</h1>
        <p>${planType === 'pro' ? planInfo.name + ' - ' + planInfo.price : planInfo.price + ' - ' + planInfo.duration}</p>
      </div>

      <div class="plan-summary">
        <h3>Seu plano inclui:</h3>
        <div class="summary-grid">
          ${planInfo.features.filter(f => f.included).map(f => `
            <div class="summary-item">
              <span class="check">✓</span>
              <span>${f.name}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="action-buttons">
        <div class="auth-options">
          <p style="margin-bottom: 15px; color: #666; font-size: 14px;">
            ℹ️ ${isOptional ? 'Faça login para começar (opcional)' : 'Faça login para continuar'}
          </p>
          <div id="${containerId}"></div>
          ${isOptional ? '<button class="btn-secondary" onclick="startFreeWithoutLogin()" style="margin-top: 15px; width: 100%;">➜ Começar sem Login</button>' : '<button class="btn-secondary" onclick="handleTestLoginPro()" style="margin-top: 15px; width: 100%;">🧪 Continuar em Modo Teste</button>'}
        </div>
      </div>

      <button class="btn-cancel" onclick="showPlansComparison()">
        ← Voltar aos Planos
      </button>
    </div>
  `;
  
  wizardEl.innerHTML = html;
  
  // Carregar Google Sign-In se disponível
  if (typeof google !== 'undefined' && google.accounts) {
    setTimeout(() => {
      const container = document.getElementById(containerId);
      if (container) {
        google.accounts.id.initialize({
          client_id: 'YOUR_GOOGLE_CLIENT_ID',
          callback: handleGoogleSignIn
        });
        
        google.accounts.id.renderButton(container, {
          type: 'standard',
          size: 'large',
          text: 'signin_with',
          locale: 'pt-BR',
          width: '100%'
        });
      }
    }, 100);
  }
}

function startFreeWithoutLogin() {
  currentUser = null;
  selectedPlan = 'free';
  showHomePage();
}

async function handleTestLoginPro() {
  try {
    const testUser = {
      email: `user_${Date.now()}@filesfy.test`,
      name: `Usuário Teste ${Math.floor(Math.random() * 1000)}`
    };
    
    const response = await ApiClient.testLogin(testUser.email, testUser.name);
    
    if (response.user && response.jwtToken) {
      localStorage.setItem('auth_token', response.jwtToken);
      localStorage.setItem('user_data', JSON.stringify(response.user));
      
      currentUser = response.user;
      selectedPlan = 'pro';
      updateHeader();
      loadUserSubscription();
      showPaymentPage();
    } else {
      alert('Erro: Resposta inválida do servidor. Verifique o console.');
    }
  } catch (error) {
    console.error('❌ Erro em test login:', error);
    alert('Erro ao fazer login em modo teste:\n\n' + (error.error || error.message || 'Verifique a conexão com o servidor'));
  }
}

async function handleGoogleSignIn(response) {
  try {
    const { credential } = response;
    if (typeof authManager !== 'undefined') {
      await authManager.loginWithGoogle(credential, null);
      currentUser = authManager.getUser();
      
      updateHeader();
      loadUserSubscription();
      
      // Navegar conforme plano selecionado
      if (selectedPlan === 'pro') {
        showPaymentPage();
      } else {
        showHomePage();
      }
    }
  } catch (error) {
    console.error('Erro no login:', error);
    alert('Erro ao fazer login com Google. Tente novamente.');
  }
}

function showHomePage() {
  currentStep = 0;
  
  const planKey = (selectedPlan || 'free').toLowerCase();
  const planInfo = PLANS[planKey];
  const isProUser = planKey === 'pro' && currentUser;
  
  const html = `
    <div class="home-container">
      <div class="welcome-section">
        <h1>Bem-vindo ao Filesfy</h1>
        <p>${planInfo ? planInfo.name + ' - ' + planInfo.price : 'Plano não definido'}</p>
      </div>

      <div class="plan-summary">
        <h3>Seu plano inclui:</h3>
        <div class="summary-grid">
          ${planInfo && planInfo.features ? planInfo.features.filter(f => f.included).map(f => `
            <div class="summary-item">
              <span class="check">✓</span>
              <span>${f.name}</span>
            </div>
          `).join('') : ''}
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn-primary" onclick="renderSelectDevice()">
          📁 Iniciar Recuperação
        </button>
      </div>

      <button class="btn-cancel" onclick="showPlansComparison()">
        ← Voltar aos Planos
      </button>
    </div>
  `;
  
  wizardEl.innerHTML = html;
}

function showPaymentPage() {
  currentStep = 0;
  
  // Validar autenticação
  if (!currentUser || !currentUser.id) {
    console.warn('⚠️ Usuário não autenticado. Redirecionando para login...');
    showProLoginPage();
    return;
  }
  
  console.log('💳 Abrindo página de pagamento para usuário:', currentUser.id);
  
  wizardEl.innerHTML = `
    <div class="payment-container">
      <div class="payment-header">
        <h2>Escolha a Forma de Pagamento</h2>
        <p>Clique em uma opção para continuar</p>
        <div class="payment-amount">
          <span>Total:</span>
          <strong>R$ 15,99</strong>
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
      
      <div style="display: flex; justify-content: center; margin-top: 20px;">
        <button class="btn-cancel" id="btn-back-payment">
          Voltar
        </button>
      </div>
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
      <p>Método: ${method === 'pix' ? 'PIX' : method === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito'}</p>
    </div>
  `;
  
  try {
    if (!currentUser || !currentUser.id) {
      throw new Error('Usuário não autenticado ou ID não disponível. Por favor, faça login novamente.');
    }
    
    if (typeof ApiClient === 'undefined') {
      throw new Error('Cliente API não disponível');
    }
    
    const paymentIntent = await ApiClient.createPaymentIntent(
      currentUser.id,
      'PRO',
      method
    );
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await loadUserSubscription();
    showPaymentSuccess();
  } catch (error) {
    console.error('❌ Erro no pagamento:', error);
    wizardEl.innerHTML = `
      <div class="error-container">
        <h2>Erro no Pagamento</h2>
        <p>${error.error || error.message || 'Não foi possível processar o pagamento'}</p>
        <button class="btn-primary" id="btn-retry-payment">
          Tentar Novamente
        </button>
        <button class="btn-secondary" id="btn-back-home-error">
          Voltar ao Início
        </button>
      </div>
    `;
    
    document.getElementById('btn-retry-payment').addEventListener('click', () => {
      showPaymentPage();
    });
    
    document.getElementById('btn-back-home-error').addEventListener('click', () => {
      showHomePage();
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
    selectedPlan = 'pro';
    renderSelectDevice();
  });
}

function renderSelectDevice() {
  currentStep = 1;
  
  // Detectar dispositivos conectados (simulado)
  const connectedMobile = detectMobileDevice();
  
  devices = [
    { id: 'local', name: 'Disco Local', size: '500GB', icon: 'hdd' },
    { id: 'hd_externo', name: 'HD Externo', size: '1TB', icon: 'hdd' },
    { id: 'pendrive', name: 'Pendrive', size: '32GB', icon: 'usb' }
  ];
  
  // Adicionar mobile se detectado
  if (connectedMobile) {
    devices.push({
      id: 'mobile',
      name: `${connectedMobile.brand} ${connectedMobile.model}`,
      size: connectedMobile.storage,
      icon: 'mobile'
    });
  }
  
  let html = `
    <div class="step-container">
      <h2>Selecione um Dispositivo</h2>
      <div class="device-list">
  `;
  
  devices.forEach(device => {
    const deviceIcon = getDeviceIcon(device.icon);
    html += `
      <div class="device-card" data-device-id="${device.id}">
        ${deviceIcon}
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
      <button class="btn-cancel" id="btn-back-device">
        ← Voltar
      </button>
    </div>
  `;
  
  wizardEl.innerHTML = html;
  updateFooter('Selecione um dispositivo', 1, 5);
  
  // Adicionar listeners aos cards
  setTimeout(() => {
    const cards = document.querySelectorAll('.device-card');
    const btnBack = document.getElementById('btn-back-device');
    
    if (cards.length === 0) return;
    
    // Listener para botão Voltar
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        showHomePage();
      });
    }
    
    cards.forEach((card) => {
      const deviceId = card.dataset.deviceId;
      
      card.style.cursor = 'pointer';
      
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedDevice = deviceId;
        renderSelectType();
      });
    });
  }, 100);
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
      <button class="btn-cancel" id="btn-back-device">
        ← Voltar para Dispositivos
      </button>
    </div>
  `;
  
  wizardEl.innerHTML = html;
  updateFooter('Selecione o tipo de arquivo', 2, 5);
  
  setTimeout(() => {
    const cards = document.querySelectorAll('.file-type-card');
    const btnBack = document.getElementById('btn-back-device');
    
    // Listener para botão Voltar
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        renderSelectDevice();
      });
    }
    
    cards.forEach((card, index) => {
      card.style.cursor = 'pointer';
      
      card.addEventListener('click', function(e) {
        e.stopPropagation();
        selectedFileType = this.dataset.type;
        renderScan();
      });
      
      card.querySelectorAll('*').forEach(el => {
        el.style.pointerEvents = 'none';
      });
    });
  }, 50);
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
  
  // Gerar resultados mock com tamanhos maiores para teste
  const allResults = [
    { id: 1, name: 'Foto_Férias_2024.jpg', size: '4.2MB', sizeInMB: 4.2, type: 'image' },
    { id: 2, name: 'Vídeo_Aniversário.mp4', size: '512MB', sizeInMB: 512, type: 'video' },
    { id: 3, name: 'Documento_Importante.pdf', size: '2.1MB', sizeInMB: 2.1, type: 'document' },
    { id: 4, name: 'Planilha_2024.xlsx', size: '1.5MB', sizeInMB: 1.5, type: 'document' },
    { id: 5, name: 'Música_Favorita.mp3', size: '8.5MB', sizeInMB: 8.5, type: 'audio' },
    { id: 6, name: 'Apresentação.pptx', size: '15.3MB', sizeInMB: 15.3, type: 'document' },
    { id: 7, name: 'Código_Projeto.zip', size: '52.1MB', sizeInMB: 52.1, type: 'archive' },
    { id: 8, name: 'Backup_Database.sql', size: '128.5MB', sizeInMB: 128.5, type: 'document' },
    { id: 9, name: 'Vídeo_Completo.mkv', size: '256MB', sizeInMB: 256, type: 'video' },
    { id: 10, name: 'Arquivo_Grande.iso', size: '450MB', sizeInMB: 450, type: 'archive' }
  ];
  
  // Mapear tipos selecionados para tipos de arquivo
  const typeMapping = {
    todos: ['image', 'video', 'audio', 'document', 'archive'],
    imagens: ['image'],
    videos: ['video'],
    audio: ['audio'],
    docs: ['document'],
    archive: ['archive']
  };
  
  const allowedTypes = typeMapping[selectedFileType] || typeMapping.todos;
  
  // Filtrar por tipo de arquivo selecionado
  const filteredResults = allResults.filter(file => allowedTypes.includes(file.type));
  
  // Definir limites por plano
  const planLimits = {
    free: { maxFiles: 5, maxSizeMB: 300 },
    pro: { maxFiles: 10, maxSizeMB: 1024 }
  };
  
  const currentPlan = (selectedPlan || 'free').toLowerCase();
  const limits = planLimits[currentPlan];
  
  // Aplicar filtros de limite
  scanResults = [];
  let totalSizeMB = 0;
  let fileCount = 0;
  
  filteredResults.forEach(file => {
    // Verificar se pode adicionar este arquivo
    const wouldExceedFileLimit = fileCount >= limits.maxFiles;
    const wouldExceedSizeLimit = (totalSizeMB + file.sizeInMB) > limits.maxSizeMB;
    const canRecover = !wouldExceedFileLimit && !wouldExceedSizeLimit;
    
    scanResults.push({
      ...file,
      canRecover,
      blockedReason: wouldExceedFileLimit ? 'Limite de arquivos atingido' : 
                     wouldExceedSizeLimit ? 'Limite de tamanho atingido' : null
    });
    
    // Contar apenas arquivos recuperáveis
    if (canRecover) {
      totalSizeMB += file.sizeInMB;
      fileCount++;
    }
  });
  
  selectedFiles = [];
  
  // Mapear nome do tipo para exibição
  const typeDisplayNames = {
    todos: 'Todos os Arquivos',
    imagens: 'Imagens',
    videos: 'Vídeos',
    audio: 'Áudio',
    docs: 'Documentos'
  };
  
  const typeDisplay = typeDisplayNames[selectedFileType] || 'Arquivos';
  
  let html = `
    <div class="step-container">
      <h2>Arquivos Encontrados</h2>
      <div class="results-header">
        <button class="btn-small" id="btn-select-all">Selecionar Tudo</button>
        <span class="results-count">0 / ${scanResults.filter(f => f.canRecover).length} selecionados</span>
      </div>
      <div class="results-info">
        <p>Tipo: <strong>${typeDisplay}</strong> | Plano: <strong>${currentPlan.toUpperCase()}</strong> | Limite: <strong>${limits.maxFiles} arquivos</strong>, <strong>${limits.maxSizeMB}MB</strong> por varredura</p>
      </div>
      <div class="results-list">
  `;
  
  scanResults.forEach(file => {
    const disabled = !file.canRecover ? 'disabled' : '';
    const blockedIcon = file.blockedReason ? '🔒' : '✓';
    const blockedMessage = file.blockedReason ? `<p class="blocked-reason">${blockedIcon} ${file.blockedReason}</p>` : '';
    
    html += `
      <div class="result-item ${disabled}" data-file-id="${file.id}">
        <input type="checkbox" class="file-checkbox" ${disabled}>
        <span class="file-icon">${getFileIcon(file.type)}</span>
        <div class="file-details">
          <p class="file-name">${file.name}</p>
          <p class="file-size">${file.size}</p>
          ${blockedMessage}
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
      <button class="btn-primary" id="btn-recover">
        Recuperar Arquivos Selecionados
      </button>
      <button class="btn-cancel" id="btn-back-type">
        ← Voltar para Tipos de Arquivo
      </button>
    </div>
  `;
  
  wizardEl.innerHTML = html;
  updateFooter('Selecione os arquivos', 4, 5);
  
  const selectAllBtn = document.getElementById('btn-select-all');
  const btnBack = document.getElementById('btn-back-type');
  const checkboxes = document.querySelectorAll('.file-checkbox:not([disabled])');
  const resultsCount = document.querySelector('.results-count');
  
  // Listener para botão Voltar
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      renderSelectType();
    });
  }
  
  selectAllBtn.addEventListener('click', () => {
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    updateFileSelection();
  });
  
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', updateFileSelection);
  });
  
  function updateFileSelection() {
    selectedFiles = [];
    checkboxes.forEach((cb) => {
      if (cb.checked) {
        const fileId = parseInt(cb.closest('.result-item').dataset.fileId);
        selectedFiles.push(fileId);
      }
    });
    const recoveringCount = scanResults.filter(f => f.canRecover).length;
    resultsCount.textContent = `${selectedFiles.length} / ${recoveringCount} selecionados`;
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

function getDeviceIcon(type) {
  const icons = {
    hdd: `<svg class="device-icon" viewBox="0 0 24 24">
      <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54h2.96l3.49-4.5-3.7-3.02-1.99 2.54-2.28-2.97H6.5l3.54 4.7-2.08 2.71h2.97z"/>
    </svg>`,
    usb: `<svg class="device-icon" viewBox="0 0 24 24">
      <path fill="currentColor" d="M15 7v4h1v2h-3V5h2l-3-4-3 4h2v8H8v-2.07c.7-.37 1.2-1.08 1.2-1.93 0-1.21-.99-2.2-2.2-2.2-1.21 0-2.2.99-2.2 2.2 0 .85.5 1.56 1.2 1.93V13c0 1.11.89 2 2 2h3v3.05c-.71.37-1.2 1.1-1.2 1.95 0 1.22.99 2.2 2.2 2.2 1.21 0 2.2-.98 2.2-2.2 0-.85-.49-1.58-1.2-1.95V15h3c1.11 0 2-.89 2-2v-2h1V7h-4z"/>
    </svg>`,
    mobile: `<svg class="device-icon" viewBox="0 0 24 24">
      <path fill="currentColor" d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
    </svg>`
  };
  return icons[type] || icons.hdd;
}

function detectMobileDevice() {
  // Simulação de detecção de dispositivo mobile
  // Em produção, isso seria feito com APIs do sistema operacional
  const random = Math.random();
  
  // 50% de chance de ter um mobile conectado (para demo)
  if (random > 0.5) {
    const devices = [
      { brand: 'Samsung', model: 'Galaxy S23', storage: '128GB' },
      { brand: 'iPhone', model: '15 Pro', storage: '256GB' },
      { brand: 'Xiaomi', model: 'Redmi Note 12', storage: '64GB' },
      { brand: 'Motorola', model: 'Edge 40', storage: '128GB' }
    ];
    return devices[Math.floor(Math.random() * devices.length)];
  }
  
  return null;
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

const POLICIES = {
  privacy: {
    title: 'Política de Privacidade',
    content: `<h3>1 — POLÍTICA DE PRIVACIDADE</h3><h4>1.1 — Introdução</h4><p>Esta Política de Privacidade estabelece os princípios e as diretrizes de tratamento de dados pessoais coletados pela Filesfy, em conformidade com a Lei Geral de Proteção de Dados – LGPD (Lei nº 13.709/2018).</p><h4>1.2 — Dados Coletados</h4><p><strong>a. Identificação:</strong> Nome, CPF, Data de nascimento, Identificadores digitais</p><p><strong>b. Contato:</strong> E-mail, Telefone, Endereço</p><p><strong>c. Técnicos:</strong> IP, Logs, Dados de uso</p><h4>1.3 — Finalidades</h4><ul><li>Fornecer e melhorar o serviço</li><li>Cumprir obrigações legais</li><li>Comunicação com usuário</li><li>Suporte técnico</li></ul>`
  },
  product: {
    title: 'Política de Produtos',
    content: `<h3>2 — POLÍTICA DE PRODUTO</h3><h4>2.1 — Escopo</h4><p>Esta política define regras de uso, responsabilidades e garantias do produto.</p><h4>2.2 — Uso Adequado</h4><p>O usuário concorda em utilizar o produto para fins lícitos e legais, respeitando normas de privacidade.</p><h4>2.3 — Limitações Técnicas</h4><p>Não garantimos recuperação integral em danos físicos severos ou mídias corrompidas.</p>`
  },
  license: {
    title: 'Contrato de Licença',
    content: `<h3>3 — CONTRATO DE LICENÇA DE USO</h3><h4>CLÁUSULA 1 — OBJETO</h4><p>Concessão de licença de uso não exclusiva e não transferível do software Filesfy.</p><h4>CLÁUSULA 2 — LICENÇA</h4><p>Pessoal, intransferível e válida pelo prazo contratado. Proibido: alugar, sublicenciar, descompilar.</p><h4>CLÁUSULA 3 — PREÇO E PAGAMENTO</h4><p>O LICENCIADO pagará conforme as condições acordadas.</p><h4>CLÁUSULA 8 — LEI APLICÁVEL</h4><p>Regido pela legislação brasileira.</p>`
  },
  about: {
    title: 'Sobre Filesfy',
    content: `<h3>SOBRE O FILESFY</h3><p><strong>Versão:</strong> 1.0.0</p><p><strong>Descrição:</strong> Aplicação de desktop em Electron para recuperação segura de arquivos deletados.</p><p><strong>Funcionalidades:</strong></p><ul><li>Recuperação de múltiplos tipos</li><li>Suporte a múltiplos dispositivos</li><li>Planos FREE e PRO</li><li>Autenticação Google OAuth</li><li>Sistema de pagamento Stripe</li></ul><p><strong>© 2026 Filesfy Inc.</strong></p>`
  }
};

function showPrivacyPolicy(e) {
  e.preventDefault();
  showModal(POLICIES.privacy.title, POLICIES.privacy.content);
}

function showProductPolicy(e) {
  e.preventDefault();
  showModal(POLICIES.product.title, POLICIES.product.content);
}

function showLicenseAgreement(e) {
  e.preventDefault();
  showModal(POLICIES.license.title, POLICIES.license.content);
}

function showCookies(e) {
  e.preventDefault();
  const content = `<h3>PREFERÊNCIAS DE COOKIES</h3><p>Cookies são pequenos arquivos de dados no seu dispositivo para melhorar sua experiência.</p><h4>Tipos Utilizados:</h4><ul><li><strong>Essenciais:</strong> Funcionamento da aplicação</li><li><strong>Analíticos:</strong> Medição de desempenho</li><li><strong>Funcionais:</strong> Lembrar preferências</li></ul><p>Gerencie suas preferências nas configurações do navegador.</p>`;
  showModal('Preferências de Cookies', content);
}

function showAbout(e) {
  e.preventDefault();
  showModal(POLICIES.about.title, POLICIES.about.content);
}

function setAccessStatus(message) {
  const statusEl = document.getElementById('access-status');
  if (statusEl) {
    statusEl.textContent = message || '';
  }
}

function setAccessPanelVisibility(open) {
  isAccessPanelOpen = open;
  if (accessMenuPanelEl) {
    accessMenuPanelEl.hidden = !open;
  }
  if (accessMenuToggleEl) {
    accessMenuToggleEl.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (open) {
    document.addEventListener('click', handleAccessMenuOutside, true);
    document.addEventListener('keydown', handleAccessMenuKeydown, true);
  } else {
    document.removeEventListener('click', handleAccessMenuOutside, true);
    document.removeEventListener('keydown', handleAccessMenuKeydown, true);
  }
}

function toggleAccessPanel() {
  setAccessPanelVisibility(!isAccessPanelOpen);
}

function handleAccessMenuOutside(event) {
  if (!accessMenuPanelEl || !accessMenuToggleEl) return;
  if (accessMenuPanelEl.contains(event.target) || accessMenuToggleEl.contains(event.target)) return;
  setAccessPanelVisibility(false);
}

function handleAccessMenuKeydown(event) {
  if (event.key === 'Escape') {
    setAccessPanelVisibility(false);
    accessMenuToggleEl?.focus();
  }
}

function adjustZoom(delta) {
  accessibilityState.zoom = Math.min(1.25, Math.max(0.9, accessibilityState.zoom + delta));
  document.body.style.zoom = accessibilityState.zoom;
  setAccessStatus(`Zoom ${Math.round(accessibilityState.zoom * 100)}%`);
}

function toggleContrastMode() {
  accessibilityState.contrast = !accessibilityState.contrast;
  document.body.classList.toggle('access-contrast', accessibilityState.contrast);
  setAccessStatus(accessibilityState.contrast ? 'Alto contraste ativo' : 'Alto contraste desativado');
}

function handleHoverSpeak(event) {
  if (!accessibilityState.hoverReading) return;
  const target = event.target.closest('[data-readable], button, .plan-card, .device-card, .file-type-card, .payment-option, .result-item, .filter-btn, .btn-primary, .btn-secondary');
  if (!target) return;

  const text = (target.getAttribute('data-readable') || target.getAttribute('aria-label') || target.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
  const now = Date.now();

  if (!text || (text === lastSpokenText && now - lastSpeakTime < 1200)) return;

  lastSpokenText = text;
  lastSpeakTime = now;

  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 180));
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.error('Leitura por voz falhou:', err);
  }
}

function toggleHoverReading() {
  accessibilityState.hoverReading = !accessibilityState.hoverReading;
  document.body.classList.toggle('read-hover-enabled', accessibilityState.hoverReading);

  if (accessibilityState.hoverReading) {
    if (!hoverReadHandler) {
      hoverReadHandler = handleHoverSpeak;
      document.addEventListener('mouseover', hoverReadHandler);
    }
    setAccessStatus('Leitura por voz ao passar o mouse ativada');
  } else {
    if (hoverReadHandler) {
      document.removeEventListener('mouseover', hoverReadHandler);
      hoverReadHandler = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setAccessStatus('Leitura por voz desativada');
  }
}

function initAccessibilityControls() {
  if (accessibilityInitialized) return;
  accessibilityInitialized = true;

  accessMenuToggleEl = document.getElementById('access-menu-toggle');
  accessMenuPanelEl = document.getElementById('access-menu-panel');

  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnContrast = document.getElementById('btn-contrast');
  const btnHoverRead = document.getElementById('btn-hover-read');

  if (accessMenuToggleEl) {
    accessMenuToggleEl.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleAccessPanel();
    });
  }
  if (accessMenuPanelEl) {
    accessMenuPanelEl.addEventListener('click', (event) => event.stopPropagation());
  }
  setAccessPanelVisibility(false);

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => adjustZoom(0.1));
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => adjustZoom(-0.1));
  }
  if (btnContrast) {
    btnContrast.addEventListener('click', toggleContrastMode);
  }
  if (btnHoverRead) {
    btnHoverRead.addEventListener('click', toggleHoverReading);
  }

  setAccessStatus('Ferramentas de acessibilidade prontas');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initAccessibilityControls();
    initThemeControls();
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
  initAccessibilityControls();
  initThemeControls();
  if (typeof authManager !== 'undefined' && authManager.isAuthenticated && authManager.isAuthenticated()) {
    currentUser = authManager.getUser();
    selectedPlan = authManager.getPlan && authManager.getPlan() || 'FREE';
    updateHeader();
    loadUserSubscription();
  } else {
    showPlansComparison();
  }
}

// ===== Gerenciamento de Tema =====

function initThemeControls() {
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', async () => {
      await toggleTheme();
    });
  }
  
  // Carregar tema salvo ou padrão
  loadTheme();
  
  // Ouvir mudanças de tema do Electron main
  if (typeof window.electron !== 'undefined' && window.electron.onThemeChanged) {
    window.electron.onThemeChanged((theme) => {
      applyTheme(theme);
    });
  }
}

async function toggleTheme() {
  try {
    if (typeof window.electron !== 'undefined' && window.electron.invoke) {
      const newTheme = await window.electron.invoke('toggle-theme');
      applyTheme(newTheme);
      localStorage.setItem('app-theme', newTheme);
    }
  } catch (error) {
    console.error('Erro ao alternar tema:', error);
  }
}

async function setTheme(theme) {
  try {
    if (typeof window.electron !== 'undefined' && window.electron.invoke) {
      const appliedTheme = await window.electron.invoke('set-theme', theme);
      applyTheme(appliedTheme);
      localStorage.setItem('app-theme', appliedTheme);
    }
  } catch (error) {
    console.error('Erro ao definir tema:', error);
  }
}

async function loadTheme() {
  try {
    let theme = localStorage.getItem('app-theme');
    
    if (!theme) {
      if (typeof window.electron !== 'undefined' && window.electron.invoke) {
        theme = await window.electron.invoke('get-theme');
      } else {
        theme = 'dark';
      }
    }
    
    applyTheme(theme);
  } catch (error) {
    console.error('Erro ao carregar tema:', error);
    applyTheme('dark');
  }
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
  } else {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
  }
  
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  if (btnThemeToggle) {
    btnThemeToggle.textContent = theme === 'light' ? '🌙 Tema' : '☀️ Tema';
    btnThemeToggle.title = theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro';
  }
}

