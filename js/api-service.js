// API Service for backend integration
class ApiService {
  constructor() {
    this.baseUrl = '../php/api.php';
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async request(method, action, data = null) {
    const url = `${this.baseUrl}?action=${action}`;
    
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Request failed');
      }
      
      return result;
    } catch (error) {
      console.error('API Request failed:', error);
      
      // If offline, store request for later sync
      if (!this.isOnline) {
        this.storeOfflineRequest(method, action, data);
        throw new Error('Currently offline. Request will be synced when connection is restored.');
      }
      
      throw error;
    }
  }

  // GET requests
  async get(action, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}?action=${action}&${queryString}`;
    
    try {
      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Request failed');
      }
      
      return result;
    } catch (error) {
      console.error('GET request failed:', error);
      
      // Return cached data if offline
      if (!this.isOnline) {
        const cachedData = this.getCachedData(action);
        if (cachedData) {
          return cachedData;
        }
      }
      
      throw error;
    }
  }

  // POST requests
  async post(action, data) {
    return this.request('POST', action, data);
  }

  // PUT requests
  async put(action, data) {
    return this.request('PUT', action, data);
  }

  // DELETE requests
  async delete(action, data) {
    return this.request('DELETE', action, data);
  }

  // Specific API methods
  async login(email, password) {
    try {
      const result = await this.post('login', { email, password });
      if (result.success) {
        // Cache user data
        localStorage.setItem('userData', JSON.stringify(result));
      }
      return result;
    } catch (error) {
      // Fallback to localStorage for offline login
      if (!this.isOnline) {
        return this.offlineLogin(email, password);
      }
      throw error;
    }
  }

  async getOrders() {
    try {
      const result = await this.get('orders');
      if (result.success) {
        // Cache orders data
        localStorage.setItem('cachedOrders', JSON.stringify(result.data));
      }
      return result;
    } catch (error) {
      // Return cached data if available
      const cached = localStorage.getItem('cachedOrders');
      if (cached) {
        return { success: true, data: JSON.parse(cached) };
      }
      throw error;
    }
  }

  async addOrder(orderData) {
    try {
      const result = await this.post('add_order', orderData);
      if (result.success) {
        // Update cached orders
        this.updateCachedOrders(orderData, 'add');
        // Add notification
        this.addNotification('orders', 'Order Added', `Order #${orderData.order_id} has been created`, '📋');
      }
      return result;
    } catch (error) {
      if (!this.isOnline) {
        // Store offline and add to local data
        this.storeOfflineRequest('POST', 'add_order', orderData);
        this.updateCachedOrders(orderData, 'add');
        return { success: true, message: 'Order saved offline. Will sync when online.' };
      }
      throw error;
    }
  }

  async searchCustomers(query) {
    try {
      const result = await this.get('search_customers', { query });
      return result;
    } catch (error) {
      // Return empty array if offline or error
      return { success: true, data: [] };
    }
  }

  async getCustomers() {
    try {
      const result = await this.get('customers');
      if (result.success) {
        // Cache customers data
        localStorage.setItem('cachedCustomers', JSON.stringify(result.data));
      }
      return result;
    } catch (error) {
      // Return cached data if available
      const cached = localStorage.getItem('cachedCustomers');
      if (cached) {
        return { success: true, data: JSON.parse(cached) };
      }
      throw error;
    }
  }

  async getUserSettings(email) {
    try {
      const result = await this.get('user_settings', { email });
      return result;
    } catch (error) {
      // Return localStorage settings as fallback
      const localSettings = localStorage.getItem('userSettings');
      if (localSettings) {
        return { success: true, data: JSON.parse(localSettings) };
      }
      throw error;
    }
  }

  async saveUserSettings(settingsData) {
    try {
      const result = await this.post('save_user_settings', settingsData);
      if (result.success) {
        // Also save to localStorage
        localStorage.setItem('userSettings', JSON.stringify(settingsData));
      }
      return result;
    } catch (error) {
      if (!this.isOnline) {
        // Save locally
        localStorage.setItem('userSettings', JSON.stringify(settingsData));
        this.storeOfflineRequest('POST', 'save_user_settings', settingsData);
        return { success: true, message: 'Settings saved offline. Will sync when online.' };
      }
      throw error;
    }
  }

  async changePassword(email, currentPassword, newPassword) {
    return this.post('change_password', {
      email,
      current_password: currentPassword,
      new_password: newPassword
    });
  }

  // Admin methods for data management
  async clearAllData(adminEmail) {
    return this.post('clear_all_data', { admin_email: adminEmail });
  }

  async resetToSampleData(adminEmail) {
    return this.post('reset_to_sample_data', { admin_email: adminEmail });
  }

  // Offline support methods
  storeOfflineRequest(method, action, data) {
    const offlineRequests = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
    offlineRequests.push({
      id: Date.now(),
      method,
      action,
      data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('offlineRequests', JSON.stringify(offlineRequests));
  }

  async syncOfflineData() {
    const offlineRequests = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
    
    if (offlineRequests.length === 0) return;

    console.log(`Syncing ${offlineRequests.length} offline requests...`);

    for (const request of offlineRequests) {
      try {
        await this.request(request.method, request.action, request.data);
        console.log(`Synced: ${request.action}`);
      } catch (error) {
        console.error(`Failed to sync ${request.action}:`, error);
      }
    }

    // Clear synced requests
    localStorage.removeItem('offlineRequests');
    
    // Show notification
    if (window.laundryApp) {
      window.laundryApp.addNotification('system', 'Data Synced', 'Offline data has been synchronized', '🔄');
    }
  }

  offlineLogin(email, password) {
    // Check against cached staff accounts
    const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
    const staff = staffAccounts.find(acc => acc.email === email && acc.password === password);
    
    if (staff) {
      return {
        success: true,
        role: 'staff',
        name: staff.name,
        id: staff.id
      };
    }
    
    // Check admin
    if (email === 'admin@aquaruse') {
      return {
        success: true,
        role: 'admin',
        name: 'Admin User'
      };
    }
    
    throw new Error('Invalid credentials');
  }

  getCachedData(action) {
    const cacheKey = `cached${action.charAt(0).toUpperCase() + action.slice(1)}`;
    const cached = localStorage.getItem(cacheKey);
    return cached ? { success: true, data: JSON.parse(cached) } : null;
  }

  updateCachedOrders(orderData, operation) {
    const cached = localStorage.getItem('cachedOrders');
    if (cached) {
      const orders = JSON.parse(cached);
      
      if (operation === 'add') {
        orders.unshift(orderData);
      } else if (operation === 'update') {
        const index = orders.findIndex(o => o.order_id === orderData.order_id);
        if (index !== -1) {
          orders[index] = orderData;
        }
      } else if (operation === 'delete') {
        const index = orders.findIndex(o => o.order_id === orderData.order_id);
        if (index !== -1) {
          orders.splice(index, 1);
        }
      }
      
      localStorage.setItem('cachedOrders', JSON.stringify(orders));
    }
  }

  addNotification(type, title, message, icon = '🔔') {
    if (window.laundryApp) {
      window.laundryApp.addNotification(type, title, message, icon);
    }
  }

  // Connection status
  isConnected() {
    return this.isOnline;
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(this.baseUrl + '?action=health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Global API service instance
window.apiService = new ApiService();