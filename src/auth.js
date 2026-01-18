// Gerenciador de estado de autenticação
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.token = localStorage.getItem('auth_token');
    this.init();
  }

  async init() {
    if (this.token) {
      try {
        const ApiClient = require('./api.js');
        const response = await ApiClient.verifyToken();
        this.currentUser = response.user;
        this.dispatchEvent('authChanged', { user: this.currentUser });
      } catch (error) {
        console.error('Token inválido:', error);
        this.logout();
      }
    }
  }

  async loginWithGoogle(googleToken, refreshToken) {
    try {
      const ApiClient = require('./api.js');
      const response = await ApiClient.loginWithGoogle(googleToken, refreshToken);
      
      this.token = response.token;
      this.currentUser = response.user;
      
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('user_data', JSON.stringify(this.currentUser));
      
      this.dispatchEvent('authChanged', { user: this.currentUser });
      return this.currentUser;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const ApiClient = require('./api.js');
      await ApiClient.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }

    this.currentUser = null;
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    this.dispatchEvent('authChanged', { user: null });
  }

  isAuthenticated() {
    return !!this.token && !!this.currentUser;
  }

  getUser() {
    return this.currentUser;
  }

  getPlan() {
    return this.currentUser?.plan || 'FREE';
  }

  dispatchEvent(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(event);
  }
}

const authManager = new AuthManager();
module.exports = authManager;
