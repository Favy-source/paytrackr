const { validationResult } = require('express-validator');
const Income = require('../models/Income');

// @desc    Get all income sources for user
// @route   GET /api/income
// @access  Private
const getIncomes = async (req, res) => {
  try {
    const {
      category,
      frequency,
      isActive,
      sortBy = 'startDate',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = { user: req.user.id };
    
    if (category) query.category = category;
    if (frequency) query.frequency = frequency;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const incomes = await Income.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const total = await Income.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: incomes.length,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      },
      data: incomes
    });

  } catch (error) {
    console.error('Get incomes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get income sources'
    });
  }
};

// @desc    Get single income source
// @route   GET /api/income/:id
// @access  Private
const getIncome = async (req, res) => {
  try {
    const income = await Income.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!income) {
      return res.status(404).json({
        status: 'error',
        message: 'Income source not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: income
    });

  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get income source'
    });
  }
};

// @desc    Create new income source
// @route   POST /api/income
// @access  Private
const createIncome = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const incomeData = {
      ...req.body,
      user: req.user.id
    };

    const income = new Income(incomeData);
    await income.save();

    res.status(201).json({
      status: 'success',
      message: 'Income source created successfully',
      data: income
    });

  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create income source'
    });
  }
};

// @desc    Update income source
// @route   PUT /api/income/:id
// @access  Private
const updateIncome = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!income) {
      return res.status(404).json({
        status: 'error',
        message: 'Income source not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Income source updated successfully',
      data: income
    });

  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update income source'
    });
  }
};

// @desc    Delete income source
// @route   DELETE /api/income/:id
// @access  Private
const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!income) {
      return res.status(404).json({
        status: 'error',
        message: 'Income source not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Income source deleted successfully'
    });

  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete income source'
    });
  }
};

// @desc    Get income summary
// @route   GET /api/income/summary
// @access  Private
const getIncomeSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total monthly income
    const monthlyIncome = await Income.aggregate([
      {
        $match: {
          user: userId,
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalMonthly: { $sum: '$monthlyEquivalent' },
          totalAnnual: { $sum: '$annualEquivalent' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get income by category
    const incomeByCategory = await Income.aggregate([
      {
        $match: {
          user: userId,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$category',
          totalMonthly: { $sum: '$monthlyEquivalent' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { totalMonthly: -1 }
      }
    ]);

    // Get income by frequency
    const incomeByFrequency = await Income.aggregate([
      {
        $match: {
          user: userId,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$frequency',
          totalMonthly: { $sum: '$monthlyEquivalent' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get upcoming income (next 30 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 30);

    const upcomingIncome = await Income.find({
      user: userId,
      isActive: true,
      nextExpectedDate: { $lte: upcomingDate }
    }).sort({ nextExpectedDate: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        summary: monthlyIncome[0] || { totalMonthly: 0, totalAnnual: 0, count: 0 },
        incomeByCategory,
        incomeByFrequency,
        upcomingIncome
      }
    });

  } catch (error) {
    console.error('Get income summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get income summary'
    });
  }
};

// @desc    Get income projections
// @route   GET /api/income/projections
// @access  Private
const getIncomeProjections = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const userId = req.user.id;

    const activeIncomes = await Income.find({
      user: userId,
      isActive: true
    });

    const projections = [];
    const currentDate = new Date();

    // Generate projections for the specified number of months
    for (let i = 0; i < parseInt(months); i++) {
      const projectionDate = new Date(currentDate);
      projectionDate.setMonth(projectionDate.getMonth() + i);
      
      let monthlyTotal = 0;
      const incomeBreakdown = {};

      activeIncomes.forEach(income => {
        // Check if income is still active for this projection month
        if (!income.endDate || income.endDate >= projectionDate) {
          const monthlyEquivalent = income.monthlyEquivalent;
          monthlyTotal += monthlyEquivalent;
          
          if (!incomeBreakdown[income.category]) {
            incomeBreakdown[income.category] = 0;
          }
          incomeBreakdown[income.category] += monthlyEquivalent;
        }
      });

      projections.push({
        month: projectionDate.toISOString().slice(0, 7), // YYYY-MM format
        total: monthlyTotal,
        breakdown: incomeBreakdown
      });
    }

    res.status(200).json({
      status: 'success',
      data: projections
    });

  } catch (error) {
    console.error('Get income projections error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get income projections'
    });
  }
};

// @desc    Update next expected date for income
// @route   PUT /api/income/:id/next-date
// @access  Private
const updateNextExpectedDate = async (req, res) => {
  try {
    const income = await Income.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!income) {
      return res.status(404).json({
        status: 'error',
        message: 'Income source not found'
      });
    }

    income.nextExpectedDate = income.calculateNextExpectedDate();
    await income.save();

    res.status(200).json({
      status: 'success',
      message: 'Next expected date updated',
      data: income
    });

  } catch (error) {
    console.error('Update next expected date error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update next expected date'
    });
  }
};

module.exports = {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary,
  getIncomeProjections,
  updateNextExpectedDate
};
