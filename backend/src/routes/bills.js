const express = require('express');
const { body } = require('express-validator');
const {
  getBills,
  getBill,
  createBill,
  updateBill,
  markBillAsPaid,
  deleteBill,
  getUpcomingBills,
  getBillsSummary
} = require('../controllers/billsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation rules
const billValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .isIn([
      'utilities', 'rent', 'insurance', 'subscriptions', 'internet', 
      'phone', 'food', 'transportation', 'healthcare', 'entertainment', 'other'
    ])
    .withMessage('Invalid category'),
  body('dueDate')
    .isISO8601()
    .toDate()
    .withMessage('Invalid due date'),
  body('frequency')
    .isIn(['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid frequency'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'online', 'check', 'other'])
    .withMessage('Invalid payment method'),
  body('reminderSettings.enabled')
    .optional()
    .isBoolean()
    .withMessage('Reminder enabled must be a boolean'),
  body('reminderSettings.daysBefore')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Reminder days must be between 0 and 30'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const updateBillValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .optional()
    .isIn([
      'utilities', 'rent', 'insurance', 'subscriptions', 'internet', 
      'phone', 'food', 'transportation', 'healthcare', 'entertainment', 'other'
    ])
    .withMessage('Invalid category'),
  body('dueDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid due date'),
  body('frequency')
    .optional()
    .isIn(['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid frequency'),
  body('status')
    .optional()
    .isIn(['pending', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid status'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'online', 'check', 'other'])
    .withMessage('Invalid payment method'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const markPaidValidation = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than 0'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'online', 'check', 'other'])
    .withMessage('Invalid payment method'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// @route   GET /api/bills
// @desc    Get all bills for user with filtering and pagination
// @access  Private
router.get('/', getBills);

// @route   GET /api/bills/summary
// @desc    Get bills summary
// @access  Private
router.get('/summary', getBillsSummary);

// @route   GET /api/bills/upcoming
// @desc    Get upcoming bills
// @access  Private
router.get('/upcoming', getUpcomingBills);

// @route   GET /api/bills/:id
// @desc    Get single bill
// @access  Private
router.get('/:id', getBill);

// @route   POST /api/bills
// @desc    Create new bill
// @access  Private
router.post('/', billValidation, createBill);

// @route   PUT /api/bills/:id
// @desc    Update bill
// @access  Private
router.put('/:id', updateBillValidation, updateBill);

// @route   PUT /api/bills/:id/pay
// @desc    Mark bill as paid
// @access  Private
router.put('/:id/pay', markPaidValidation, markBillAsPaid);

// @route   DELETE /api/bills/:id
// @desc    Delete bill (soft delete)
// @access  Private
router.delete('/:id', deleteBill);

module.exports = router;