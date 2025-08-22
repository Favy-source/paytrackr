const express = require('express');
const {
  getDashboardAnalytics,
  getSpendingAnalytics,
  getIncomeVsExpenseTrends,
  getBudgetAnalysis,
  getFinancialHealthScore
} = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics summary
// @access  Private
router.get('/dashboard', getDashboardAnalytics);

// @route   GET /api/analytics/spending
// @desc    Get spending analytics with period comparison
// @access  Private
router.get('/spending', getSpendingAnalytics);

// @route   GET /api/analytics/trends
// @desc    Get income vs expense trends over time
// @access  Private
router.get('/trends', getIncomeVsExpenseTrends);

// @route   GET /api/analytics/budget
// @desc    Get budget analysis and spending vs limits
// @access  Private
router.get('/budget', getBudgetAnalysis);

// @route   GET /api/analytics/health-score
// @desc    Get financial health score with recommendations
// @access  Private
router.get('/health-score', getFinancialHealthScore);

module.exports = router;