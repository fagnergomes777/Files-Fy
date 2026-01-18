// API Client para comunicação com o backend
const API_URL = 'http://localhost:3001/api';

class ApiClient {
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  }

  // Autenticação
  static loginWithGoogle(token, refreshToken) {
    return this.request('/auth/login-google', {
      method: 'POST',
      body: JSON.stringify({ token, refreshToken }),
    });
  }

  static verifyToken() {
    return this.request('/auth/verify', {
      method: 'POST',
    });
  }

  static logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Assinaturas
  static getSubscription(userId) {
    return this.request(`/subscriptions/${userId}`);
  }

  static upgradePlan(userId) {
    return this.request(`/subscriptions/${userId}/upgrade`, {
      method: 'POST',
    });
  }

  // Pagamentos
  static createPaymentIntent(userId, planType, paymentMethod) {
    return this.request('/payments/intent', {
      method: 'POST',
      body: JSON.stringify({ userId, planType, paymentMethod }),
    });
  }

  static getTransactionHistory(userId) {
    return this.request(`/payments/history/${userId}`);
  }
}

module.exports = ApiClient;
