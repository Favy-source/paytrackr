const express = require('express');
const { body } = require('express-validator');
const {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary,
  getIncomeProjections,
  updateNextExpectedDate
} = require('../controllers/incomeController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation rules
const incomeValidation = [
  body('source')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Source must be between 1 and 100 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('frequency')
    .isIn(['one-time', 'daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid frequency'),
  body('category')
    .isIn([
      'salary', 'freelance', 'business', 'investment', 'rental', 'pension', 
      'social_security', 'unemployment', 'bonus', 'commission', 'royalty', 
      'gift', 'tax_refund', 'other'
    ])
    .withMessage('Invalid category'),
  body('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid start date'),
  body('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid end date'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('employer.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Employer name cannot exceed 100 characters'),
  body('employer.address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Employer address cannot exceed 200 characters'),
  body('employer.contact')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Employer contact cannot exceed 50 characters'),
  body('taxInfo.isTaxable')
    .optional()
    .isBoolean()
    .withMessage('isTaxable must be a boolean'),
  body('taxInfo.taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
  body('taxInfo.deductions')
    .optional()
    .isArray()
    .withMessage('Deductions must be an array'),
  body('taxInfo.deductions.*.type')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Deduction type cannot exceed 50 characters'),
  body('taxInfo.deductions.*.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deduction amount must be positive'),
  body('paymentMethod')
    .optional()
    .isIn(['direct_deposit', 'check', 'cash', 'wire_transfer', 'online_payment', 'other'])
    .withMessage('Invalid payment method'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const updateIncomeValidation = [
  body('source')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Source must be between 1 and 100 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('frequency')
    .optional()
    .isIn(['one-time', 'daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid frequency'),
  body('category')
    .optional()
    .isIn([
      'salary', 'freelance', 'business', 'investment', 'rental', 'pension', 
      'social_security', 'unemployment', 'bonus', 'commission', 'royalty', 
      'gift', 'tax_refund', 'other'
    ])
    .withMessage('Invalid category'),
  body('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid start date'),
  body('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid end date'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// @route   GET /api/income
// @desc    Get all income sources for user with filtering and pagination
// @access  Private
router.get('/', getIncomes);

// @route   GET /api/income/summary
// @desc    Get income summary
// @access  Private
router.get('/summary', getIncomeSummary);

// @route   GET /api/income/projections
// @desc    Get income projections
// @access  Private
router.get('/projections', getIncomeProjections);

// @route   GET /api/income/:id
// @desc    Get single income source
// @access  Private
router.get('/:id', getIncome);

// @route   POST /api/income
// @desc    Create new income source
// @access  Private
router.post('/', incomeValidation, createIncome);

// @route   PUT /api/income/:id
// @desc    Update income source
// @access  Private
router.put('/:id', updateIncomeValidation, updateIncome);

// @route   PUT /api/income/:id/next-date
// @desc    Update next expected date for income
// @access  Private
router.put('/:id/next-date', updateNextExpectedDate);

// @route   DELETE /api/income/:id
// @desc    Delete income source (soft delete)
// @access  Private
router.delete('/:id', deleteIncome);

module.exports = router;