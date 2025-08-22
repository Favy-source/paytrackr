const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Mock chat controller functions (for future implementation)
const sendMessage = async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // For now, return a mock response
    // In a real implementation, this would integrate with OpenAI or another AI service
    const mockResponses = [
      "Based on your spending patterns, I recommend setting aside 20% of your income for savings.",
      "I noticed you have several bills due this week. Would you like me to remind you about them?",
      "Your food expenses seem higher than usual this month. Consider meal planning to reduce costs.",
      "Great job on staying within your budget this month! Keep up the good work.",
      "I can help you analyze your spending categories. Which area would you like to focus on?"
    ];
    
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    res.status(200).json({
      status: 'success',
      data: {
        message: randomResponse,
        timestamp: new Date(),
        context: 'financial_advice'
      }
    });

  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process message'
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    // Mock chat history
    const mockHistory = [
      {
        id: '1',
        user: req.user.id,
        message: "How can I reduce my monthly expenses?",
        response: "Based on your spending patterns, I recommend setting aside 20% of your income for savings.",
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        context: 'expense_advice'
      },
      {
        id: '2',
        user: req.user.id,
        message: "What are my biggest spending categories?",
        response: "Your top spending categories are: Food (35%), Transportation (25%), and Entertainment (20%).",
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        context: 'spending_analysis'
      }
    ];

    res.status(200).json({
      status: 'success',
      results: mockHistory.length,
      data: mockHistory
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get chat history'
    });
  }
};

const getFinancialInsights = async (req, res) => {
  try {
    // Mock financial insights based on user data
    const insights = [
      {
        type: 'spending_alert',
        title: 'High Food Spending',
        message: 'Your food expenses are 25% higher than last month. Consider meal planning to save money.',
        priority: 'medium',
        actionable: true,
        suggestions: [
          'Create a weekly meal plan',
          'Cook more meals at home',
          'Use grocery store apps for discounts'
        ]
      },
      {
        type: 'savings_opportunity',
        title: 'Subscription Review',
        message: 'You have 5 active subscriptions. Review and cancel unused ones to save $50/month.',
        priority: 'high',
        actionable: true,
        suggestions: [
          'List all active subscriptions',
          'Cancel unused services',
          'Consider family plans for shared services'
        ]
      },
      {
        type: 'bill_reminder',
        title: 'Upcoming Bills',
        message: 'You have 3 bills due in the next 7 days totaling $450.',
        priority: 'high',
        actionable: true,
        suggestions: [
          'Set up automatic payments',
          'Mark calendar reminders',
          'Ensure sufficient account balance'
        ]
      }
    ];

    res.status(200).json({
      status: 'success',
      data: insights
    });

  } catch (error) {
    console.error('Get financial insights error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get financial insights'
    });
  }
};

// Validation rules
const messageValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters'),
  body('context')
    .optional()
    .isIn(['general', 'expense_advice', 'budget_help', 'investment_tips', 'debt_management'])
    .withMessage('Invalid context')
];

// @route   POST /api/chat/message
// @desc    Send message to AI assistant
// @access  Private
router.post('/message', messageValidation, sendMessage);

// @route   GET /api/chat/history
// @desc    Get chat history for user
// @access  Private
router.get('/history', getChatHistory);

// @route   GET /api/chat/insights
// @desc    Get AI-generated financial insights
// @access  Private
router.get('/insights', getFinancialInsights);

module.exports = router;