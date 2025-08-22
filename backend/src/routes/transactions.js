const express = require('express');
const { body } = require('express-validator');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsSummary,
  getSpendingByCategory,
  getMonthlyTrend
} = require('../controllers/transactionsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation rules
const transactionValidation = [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .isIn([
      // Income categories
      'salary', 'freelance', 'business', 'investment', 'rental', 'gift', 'bonus', 'other_income',
      // Expense categories
      'food', 'transportation', 'housing', 'utilities', 'healthcare', 'education', 
      'entertainment', 'shopping', 'travel', 'insurance', 'debt_payment', 'savings', 
      'investment_expense', 'other_expense'
    ])
    .withMessage('Invalid category'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  body('date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid date'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'online', 'check', 'other'])
    .withMessage('Invalid payment method'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Each tag cannot exceed 30 characters'),
  body('location.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location name cannot exceed 100 characters'),
  body('location.coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('location.coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('relatedBill')
    .optional()
    .isMongoId()
    .withMessage('Invalid bill ID'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  body('recurringDetails.frequency')
    .if(body('isRecurring').equals(true))
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid recurring frequency'),
  body('recurringDetails.nextDate')
    .if(body('isRecurring').equals(true))
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid next date'),
  body('recurringDetails.endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid end date')
];

const updateTransactionValidation = [
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .optional()
    .isIn([
      // Income categories
      'salary', 'freelance', 'business', 'investment', 'rental', 'gift', 'bonus', 'other_income',
      // Expense categories
      'food', 'transportation', 'housing', 'utilities', 'healthcare', 'education', 
      'entertainment', 'shopping', 'travel', 'insurance', 'debt_payment', 'savings', 
      'investment_expense', 'other_expense'
    ])
    .withMessage('Invalid category'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  body('date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid date'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'online', 'check', 'other'])
    .withMessage('Invalid payment method'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Each tag cannot exceed 30 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// @route   GET /api/transactions
// @desc    Get all transactions for user with filtering and pagination
// @access  Private
router.get('/', getTransactions);

// @route   GET /api/transactions/summary
// @desc    Get transactions summary
// @access  Private
router.get('/summary', getTransactionsSummary);

// @route   GET /api/transactions/spending-by-category
// @desc    Get spending by category
// @access  Private
router.get('/spending-by-category', getSpendingByCategory);

// @route   GET /api/transactions/monthly-trend
// @desc    Get monthly spending trend
// @access  Private
router.get('/monthly-trend', getMonthlyTrend);

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', getTransaction);

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', transactionValidation, createTransaction);

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', updateTransactionValidation, updateTransaction);

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', deleteTransaction);

module.exports = router;