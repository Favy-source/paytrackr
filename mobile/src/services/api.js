import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.multiRemove(['authToken', 'user']);
      // Redirect to login screen or show auth modal
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
  getReferralStats: () => api.get('/auth/referral-stats'),
  validateReferralCode: (code) => api.get(`/auth/validate-referral/${code}`),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params = {}) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (transactionData) => api.post('/transactions', transactionData),
  update: (id, transactionData) => api.put(`/transactions/${id}`, transactionData),
  delete: (id) => api.delete(`/transactions/${id}`),
  getSummary: (params = {}) => api.get('/transactions/summary', { params }),
  getSpendingByCategory: (params = {}) => api.get('/transactions/spending-by-category', { params }),
  getMonthlyTrend: (params = {}) => api.get('/transactions/monthly-trend', { params }),
};

// Bills API
export const billsAPI = {
  getAll: (params = {}) => api.get('/bills', { params }),
  getById: (id) => api.get(`/bills/${id}`),
  create: (billData) => api.post('/bills', billData),
  update: (id, billData) => api.put(`/bills/${id}`, billData),
  delete: (id) => api.delete(`/bills/${id}`),
  markAsPaid: (id, paymentData) => api.put(`/bills/${id}/pay`, paymentData),
  getUpcoming: (params = {}) => api.get('/bills/upcoming', { params }),
  getSummary: () => api.get('/bills/summary'),
};

// Income API
export const incomeAPI = {
  getAll: (params = {}) => api.get('/income', { params }),
  getById: (id) => api.get(`/income/${id}`),
  create: (incomeData) => api.post('/income', incomeData),
  update: (id, incomeData) => api.put(`/income/${id}`, incomeData),
  delete: (id) => api.delete(`/income/${id}`),
  getSummary: () => api.get('/income/summary'),
  getProjections: (params = {}) => api.get('/income/projections', { params }),
  updateNextDate: (id, nextDate) => api.put(`/income/${id}/next-date`, { nextDate }),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSpending: (params = {}) => api.get('/analytics/spending', { params }),
  getTrends: (params = {}) => api.get('/analytics/trends', { params }),
  getBudgetAnalysis: () => api.get('/analytics/budget'),
  getFinancialHealth: () => api.get('/analytics/financial-health'),
};

// Chat API
export const chatAPI = {
  sendMessage: (message) => api.post('/chat/message', { message }),
  getSuggestions: () => api.get('/chat/suggestions'),
};

export default api;
