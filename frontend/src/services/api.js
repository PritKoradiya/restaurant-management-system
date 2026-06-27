const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').trim();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL.replace(/\/+$/, '');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        throw new Error(data?.message || `Request failed with status ${response.status}`);
      }

      return data ?? { success: true };
    } catch (error) {
      console.error('API Error:', error);
      if (error instanceof TypeError) {
        throw new Error(`Network error: unable to reach API at ${url}. Check backend server, API base URL, and CORS.`);
      }

      throw error;
    }
  }

  // Auth endpoints
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Menu endpoints
  async getMenuItems(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/menu${queryString ? `?${queryString}` : ''}`);
  }

  async getMenuItem(id) {
    return this.request(`/menu/${id}`);
  }

  async createMenuItem(itemData) {
    return this.request('/menu', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateMenuItem(id, itemData) {
    return this.request(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deleteMenuItem(id) {
    return this.request(`/menu/${id}`, {
      method: 'DELETE',
    });
  }

  async getMenuCategories() {
    return this.request('/menu/categories/all');
  }

  // Order endpoints
  async getOrders() {
    return this.request('/orders');
  }

  async getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  async getMyOrders() {
    return this.request('/orders/my-orders');
  }

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(id, status) {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async assignStaffToOrder(id, staffId) {
    return this.request(`/orders/${id}/assign-staff`, {
      method: 'PATCH',
      body: JSON.stringify({ staffId }),
    });
  }

  async cancelOrder(id) {
    return this.request(`/orders/${id}/cancel`, {
      method: 'PATCH',
    });
  }

  async payOrderOnline(id) {
    return this.request(`/orders/${id}/pay-online`, {
      method: 'PATCH',
    });
  }

  // User endpoints
  async getUsers() {
    return this.request('/users');
  }

  async getStaffList(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/role/staff${queryString ? `?${queryString}` : ''}`);
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async updateMyStaffStatus(staffStatus) {
    return this.request('/users/me/staff-status', {
      method: 'PATCH',
      body: JSON.stringify({ staffStatus }),
    });
  }

  async notifyAdminOrderReady(id) {
    return this.request(`/orders/${id}/notify-admin`, {
      method: 'PATCH',
    });
  }

  // Billing endpoints
  async getBillingRecords() {
    return this.request('/billing');
  }

  async getBillingForOrder(orderId) {
    return this.request(`/billing/order/${orderId}`);
  }

  async createBill(billData) {
    return this.request('/billing', {
      method: 'POST',
      body: JSON.stringify(billData),
    });
  }

  async updateBillingPaymentStatus(id, paymentStatus, transactionId) {
    return this.request(`/billing/${id}/payment-status`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus, transactionId }),
    });
  }
}

export default new ApiService();