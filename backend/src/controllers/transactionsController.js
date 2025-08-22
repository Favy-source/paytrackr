const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');

// @desc    Get all transactions for user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      search
    } = req.query;

    // Build query
    const query = { user: req.user.id };
    
    if (type) query.type = type;
    if (category) query.category = category;
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('relatedBill', 'title amount dueDate')
      .exec();

    // Get total count
    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      },
      data: transactions
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get transactions'
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('relatedBill', 'title amount dueDate');

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: transaction
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get transaction'
    });
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const transactionData = {
      ...req.body,
      user: req.user.id
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();

    // Populate related bill if exists
    await transaction.populate('relatedBill', 'title amount dueDate');

    res.status(201).json({
      status: 'success',
      message: 'Transaction created successfully',
      data: transaction
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create transaction'
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('relatedBill', 'title amount dueDate');

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Transaction updated successfully',
      data: transaction
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update transaction'
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete transaction'
    });
  }
};

// @desc    Get transactions summary
// @route   GET /api/transactions/summary
// @access  Private
const getTransactionsSummary = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const userId = req.user.id;

    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const summary = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Get category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          categories: {
            $push: {
              category: '$_id.category',
              total: '$total',
              count: '$count'
            }
          }
        }
      }
    ]);

    // Get recent transactions
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ date: -1 })
      .limit(5)
      .populate('relatedBill', 'title amount dueDate');

    res.status(200).json({
      status: 'success',
      data: {
        period,
        summary,
        categoryBreakdown,
        recentTransactions
      }
    });

  } catch (error) {
    console.error('Get transactions summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get transactions summary'
    });
  }
};

// @desc    Get spending by category
// @route   GET /api/transactions/spending-by-category
// @access  Private
const getSpendingByCategory = async (req, res) => {
  try {
    const { startDate, endDate, type = 'expense' } = req.query;
    const userId = req.user.id;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = {
      user: userId,
      type
    };

    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }

    const spendingByCategory = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: spendingByCategory
    });

  } catch (error) {
    console.error('Get spending by category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get spending by category'
    });
  }
};

// @desc    Get monthly spending trend
// @route   GET /api/transactions/monthly-trend
// @access  Private
const getMonthlyTrend = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const userId = req.user.id;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month'
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
            }
          },
          transactions: { $sum: '$count' }
        }
      },
      {
        $addFields: {
          balance: { $subtract: ['$income', '$expense'] }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: monthlyTrend
    });

  } catch (error) {
    console.error('Get monthly trend error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get monthly trend'
    });
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsSummary,
  getSpendingByCategory,
  getMonthlyTrend
};
