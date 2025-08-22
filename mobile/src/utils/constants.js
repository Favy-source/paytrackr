import { DefaultTheme } from 'react-native-paper';

// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'
  : 'https://your-production-api.com/api';

// Theme Configuration
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2196F3',
    accent: '#03DAC6',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#000000',
    onSurface: '#000000',
    disabled: '#00000061',
    placeholder: '#00000061',
    backdrop: '#00000050',
    error: '#B00020',
    notification: '#FF6347',
    success: '#4CAF50',
    warning: '#FF9800',
  },
  roundness: 8,
};

// Transaction Categories
export const TRANSACTION_CATEGORIES = {
  INCOME: [
    'salary',
    'freelance',
    'business',
    'investment',
    'rental',
    'gift',
    'bonus',
    'other_income',
  ],
  EXPENSE: [
    'food',
    'transportation',
    'housing',
    'utilities',
    'healthcare',
    'education',
    'entertainment',
    'shopping',
    'insurance',
    'subscriptions',
    'travel',
    'personal_care',
    'gifts',
    'charity',
    'other_expense',
  ],
};

// Bill Categories
export const BILL_CATEGORIES = [
  'utilities',
  'rent',
  'insurance',
  'subscriptions',
  'internet',
  'phone',
  'food',
  'transportation',
  'healthcare',
  'entertainment',
  'other',
];

// Income Categories
export const INCOME_CATEGORIES = [
  'salary',
  'freelance',
  'business',
  'investment',
  'rental',
  'pension',
  'benefits',
  'gift',
  'bonus',
  'other',
];

// Income Frequencies
export const INCOME_FREQUENCIES = [
  'one-time',
  'daily',
  'weekly',
  'bi-weekly',
  'monthly',
  'quarterly',
  'yearly',
];

// Bill Recurrence Options
export const BILL_RECURRENCE = [
  'monthly',
  'bi-monthly',
  'quarterly',
  'semi-annually',
  'annually',
  'one-time',
];

// Chart Colors
export const CHART_COLORS = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#FF6384',
  '#C9CBCF',
  '#4BC0C0',
  '#FF6384',
];

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MMM DD',
  MEDIUM: 'MMM DD, YYYY',
  LONG: 'MMMM DD, YYYY',
  TIME: 'hh:mm A',
  DATETIME: 'MMM DD, YYYY hh:mm A',
};

// Currency Settings
export const CURRENCY = {
  SYMBOL: '$',
  CODE: 'USD',
  DECIMAL_PLACES: 2,
};

// App Constants
export const APP_CONSTANTS = {
  MAX_TRANSACTION_AMOUNT: 1000000,
  MIN_TRANSACTION_AMOUNT: 0.01,
  DEFAULT_PAGE_SIZE: 20,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_TITLE_LENGTH: 100,
};

// Status Constants
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PAID: 'paid',
  UNPAID: 'unpaid',
  OVERDUE: 'overdue',
  COMPLETED: 'completed',
  PENDING: 'pending',
};

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTH_ERROR: 'Authentication failed. Please login again.',
  PERMISSION_ERROR: 'You don\'t have permission to perform this action.',
};
