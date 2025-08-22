const Transaction = require('../models/Transaction');
const Bill = require('../models/Bill');
const Income = require('../models/Income');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Current month transactions summary
    const monthlyTransactions = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Bills summary
    const billsSummary = await Bill.aggregate([
      {
        $match: {
          user: userId,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Active income sources
    const activeIncome = await Income.aggregate([
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
          count: { $sum: 1 }
        }
      }
    ]);

    // Net worth calculation (simplified)
    const incomeTotal = monthlyTransactions.find(t => t._id === 'income')?.total || 0;
    const expenseTotal = monthlyTransactions.find(t => t._id === 'expense')?.total || 0;
    const netIncome = incomeTotal - expenseTotal;

    // Recent transactions
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ date: -1 })
      .limit(5)
      .populate('relatedBill', 'title amount');

    // Upcoming bills (next 7 days)
    const upcomingBills = await Bill.find({
      user: userId,
      isActive: true,
      status: 'pending',
      dueDate: {
        $gte: currentDate,
        $lte: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    }).sort({ dueDate: 1 }).limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        monthlyTransactions,
        billsSummary,
        activeIncome: activeIncome[0] || { totalMonthly: 0, count: 0 },
        netIncome,
        recentTransactions,
        upcomingBills
      }
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get dashboard analytics'
    });
  }
};

// @desc    Get spending analytics
// @route   GET /api/analytics/spending
// @access  Private
const getSpendingAnalytics = async (req, res) => {
  try {
    const { period = 'month', compare = false } = req.query;
    const userId = req.user.id;
    const currentDate = new Date();

    // Calculate date ranges based on period
    let currentPeriodStart, currentPeriodEnd, previousPeriodStart, previousPeriodEnd;

    switch (period) {
      case 'week':
        currentPeriodStart = new Date(currentDate);
        currentPeriodStart.setDate(currentDate.getDate() - 7);
        currentPeriodEnd = currentDate;
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(currentPeriodStart.getDate() - 7);
        previousPeriodEnd = currentPeriodStart;
        break;
      case 'year':
        currentPeriodStart = new Date(currentDate.getFullYear(), 0, 1);
        currentPeriodEnd = new Date(currentDate.getFullYear(), 11, 31);
        previousPeriodStart = new Date(currentDate.getFullYear() - 1, 0, 1);
        previousPeriodEnd = new Date(currentDate.getFullYear() - 1, 11, 31);
        break;
      default: // month
        currentPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        currentPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        previousPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        previousPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    }

    // Current period spending by category
    const currentSpending = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: currentPeriodStart, $lte: currentPeriodEnd }
        }
      },
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

    let previousSpending = null;
    let comparison = null;

    if (compare === 'true') {
      // Previous period spending
      previousSpending = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Calculate comparison
      const currentTotal = currentSpending.reduce((sum, cat) => sum + cat.total, 0);
      const previousTotal = previousSpending.reduce((sum, cat) => sum + cat.total, 0);
      const change = currentTotal - previousTotal;
      const changePercent = previousTotal > 0 ? (change / previousTotal) * 100 : 0;

      comparison = {
        currentTotal,
        previousTotal,
        change,
        changePercent: Math.round(changePercent * 100) / 100
      };
    }

    // Daily spending trend for current period
    const dailySpending = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: currentPeriodStart, $lte: currentPeriodEnd }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        period,
        currentSpending,
        previousSpending,
        comparison,
        dailySpending
      }
    });

  } catch (error) {
    console.error('Get spending analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get spending analytics'
    });
  }
};

// @desc    Get income vs expense trends
// @route   GET /api/analytics/trends
// @access  Private
const getIncomeVsExpenseTrends = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const userId = req.user.id;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const trends = await Transaction.aggregate([
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
          incomeTransactions: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$count', 0]
            }
          },
          expenseTransactions: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$count', 0]
            }
          }
        }
      },
      {
        $addFields: {
          balance: { $subtract: ['$income', '$expense'] },
          savings: {
            $cond: [
              { $gt: ['$income', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$income', '$expense'] }, '$income'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Calculate averages
    const totalMonths = trends.length;
    const averages = trends.reduce(
      (acc, month) => {
        acc.avgIncome += month.income;
        acc.avgExpense += month.expense;
        acc.avgBalance += month.balance;
        acc.avgSavingsRate += month.savings;
        return acc;
      },
      { avgIncome: 0, avgExpense: 0, avgBalance: 0, avgSavingsRate: 0 }
    );

    if (totalMonths > 0) {
      averages.avgIncome = Math.round((averages.avgIncome / totalMonths) * 100) / 100;
      averages.avgExpense = Math.round((averages.avgExpense / totalMonths) * 100) / 100;
      averages.avgBalance = Math.round((averages.avgBalance / totalMonths) * 100) / 100;
      averages.avgSavingsRate = Math.round((averages.avgSavingsRate / totalMonths) * 100) / 100;
    }

    res.status(200).json({
      status: 'success',
      data: {
        trends,
        averages,
        totalMonths
      }
    });

  } catch (error) {
    console.error('Get income vs expense trends error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get income vs expense trends'
    });
  }
};

// @desc    Get budget analysis
// @route   GET /api/analytics/budget
// @access  Private
const getBudgetAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get user's budget limits from preferences
    const user = await require('../models/User').findById(userId);
    const budgetLimits = user.preferences.budgetLimits;

    if (!budgetLimits.monthly && (!budgetLimits.categories || budgetLimits.categories.length === 0)) {
      return res.status(200).json({
        status: 'success',
        message: 'No budget limits set',
        data: {
          hasLimits: false,
          monthlySpending: 0,
          categorySpending: []
        }
      });
    }

    // Current month spending
    const monthlySpending = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalSpent = monthlySpending[0]?.total || 0;

    // Category-wise spending
    const categorySpending = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' }
        }
      }
    ]);

    // Combine with budget limits
    const budgetAnalysis = {
      hasLimits: true,
      monthly: {
        limit: budgetLimits.monthly || 0,
        spent: totalSpent,
        remaining: Math.max(0, (budgetLimits.monthly || 0) - totalSpent),
        percentage: budgetLimits.monthly > 0 ? (totalSpent / budgetLimits.monthly) * 100 : 0
      },
      categories: []
    };

    if (budgetLimits.categories && budgetLimits.categories.length > 0) {
      budgetAnalysis.categories = budgetLimits.categories.map(categoryLimit => {
        const spending = categorySpending.find(s => s._id === categoryLimit.name);
        const spent = spending?.spent || 0;
        
        return {
          category: categoryLimit.name,
          limit: categoryLimit.limit,
          spent,
          remaining: Math.max(0, categoryLimit.limit - spent),
          percentage: categoryLimit.limit > 0 ? (spent / categoryLimit.limit) * 100 : 0
        };
      });
    }

    res.status(200).json({
      status: 'success',
      data: budgetAnalysis
    });

  } catch (error) {
    console.error('Get budget analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get budget analysis'
    });
  }
};

// @desc    Get financial health score
// @route   GET /api/analytics/health-score
// @access  Private
const getFinancialHealthScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get monthly income and expenses
    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const income = monthlyData.find(d => d._id === 'income')?.total || 0;
    const expenses = monthlyData.find(d => d._id === 'expense')?.total || 0;

    // Calculate various financial health metrics
    let score = 0;
    const factors = [];

    // 1. Income to Expense Ratio (30 points)
    if (income > 0) {
      const savingsRate = ((income - expenses) / income) * 100;
      if (savingsRate >= 20) {
        score += 30;
        factors.push({ name: 'Savings Rate', score: 30, status: 'excellent', value: `${Math.round(savingsRate)}%` });
      } else if (savingsRate >= 10) {
        score += 20;
        factors.push({ name: 'Savings Rate', score: 20, status: 'good', value: `${Math.round(savingsRate)}%` });
      } else if (savingsRate >= 0) {
        score += 10;
        factors.push({ name: 'Savings Rate', score: 10, status: 'fair', value: `${Math.round(savingsRate)}%` });
      } else {
        factors.push({ name: 'Savings Rate', score: 0, status: 'poor', value: `${Math.round(savingsRate)}%` });
      }
    }

    // 2. Bill Payment History (25 points)
    const billsData = await Bill.aggregate([
      {
        $match: {
          user: userId,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalBills = billsData.reduce((sum, b) => sum + b.count, 0);
    const paidBills = billsData.find(b => b._id === 'paid')?.count || 0;
    const overdueBills = billsData.find(b => b._id === 'overdue')?.count || 0;

    if (totalBills > 0) {
      const paymentRate = (paidBills / totalBills) * 100;
      if (overdueBills === 0 && paymentRate >= 90) {
        score += 25;
        factors.push({ name: 'Bill Payments', score: 25, status: 'excellent', value: `${overdueBills} overdue` });
      } else if (overdueBills <= 1) {
        score += 15;
        factors.push({ name: 'Bill Payments', score: 15, status: 'good', value: `${overdueBills} overdue` });
      } else if (overdueBills <= 3) {
        score += 8;
        factors.push({ name: 'Bill Payments', score: 8, status: 'fair', value: `${overdueBills} overdue` });
      } else {
        factors.push({ name: 'Bill Payments', score: 0, status: 'poor', value: `${overdueBills} overdue` });
      }
    }

    // 3. Spending Consistency (20 points)
    const last3Months = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' }
        }
      }
    ]);

    if (last3Months.length >= 3) {
      const amounts = last3Months.map(m => m.total);
      const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const consistency = avg > 0 ? (1 - (stdDev / avg)) * 100 : 0;

      if (consistency >= 80) {
        score += 20;
        factors.push({ name: 'Spending Consistency', score: 20, status: 'excellent', value: `${Math.round(consistency)}%` });
      } else if (consistency >= 60) {
        score += 15;
        factors.push({ name: 'Spending Consistency', score: 15, status: 'good', value: `${Math.round(consistency)}%` });
      } else if (consistency >= 40) {
        score += 8;
        factors.push({ name: 'Spending Consistency', score: 8, status: 'fair', value: `${Math.round(consistency)}%` });
      } else {
        factors.push({ name: 'Spending Consistency', score: 0, status: 'poor', value: `${Math.round(consistency)}%` });
      }
    }

    // 4. Diversified Income (15 points)
    const incomeSourcesCount = await Income.countDocuments({
      user: userId,
      isActive: true
    });

    if (incomeSourcesCount >= 3) {
      score += 15;
      factors.push({ name: 'Income Diversification', score: 15, status: 'excellent', value: `${incomeSourcesCount} sources` });
    } else if (incomeSourcesCount === 2) {
      score += 10;
      factors.push({ name: 'Income Diversification', score: 10, status: 'good', value: `${incomeSourcesCount} sources` });
    } else if (incomeSourcesCount === 1) {
      score += 5;
      factors.push({ name: 'Income Diversification', score: 5, status: 'fair', value: `${incomeSourcesCount} source` });
    } else {
      factors.push({ name: 'Income Diversification', score: 0, status: 'poor', value: 'No income sources' });
    }

    // 5. Financial Tracking Activity (10 points)
    const recentActivityDays = 30;
    const recentDate = new Date(currentDate.getTime() - recentActivityDays * 24 * 60 * 60 * 1000);
    const recentTransactions = await Transaction.countDocuments({
      user: userId,
      date: { $gte: recentDate }
    });

    if (recentTransactions >= 10) {
      score += 10;
      factors.push({ name: 'Tracking Activity', score: 10, status: 'excellent', value: `${recentTransactions} recent transactions` });
    } else if (recentTransactions >= 5) {
      score += 7;
      factors.push({ name: 'Tracking Activity', score: 7, status: 'good', value: `${recentTransactions} recent transactions` });
    } else if (recentTransactions >= 1) {
      score += 3;
      factors.push({ name: 'Tracking Activity', score: 3, status: 'fair', value: `${recentTransactions} recent transactions` });
    } else {
      factors.push({ name: 'Tracking Activity', score: 0, status: 'poor', value: 'No recent activity' });
    }

    // Determine overall rating
    let rating = 'poor';
    if (score >= 80) rating = 'excellent';
    else if (score >= 60) rating = 'good';
    else if (score >= 40) rating = 'fair';

    res.status(200).json({
      status: 'success',
      data: {
        score,
        rating,
        factors,
        recommendations: getRecommendations(factors, income, expenses)
      }
    });

  } catch (error) {
    console.error('Get financial health score error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get financial health score'
    });
  }
};

// Helper function to generate recommendations
const getRecommendations = (factors, income, expenses) => {
  const recommendations = [];

  factors.forEach(factor => {
    switch (factor.name) {
      case 'Savings Rate':
        if (factor.status === 'poor' || factor.status === 'fair') {
          recommendations.push('Consider reducing unnecessary expenses to improve your savings rate');
        }
        break;
      case 'Bill Payments':
        if (factor.status === 'poor' || factor.status === 'fair') {
          recommendations.push('Set up automatic bill payments to avoid late fees and improve your payment history');
        }
        break;
      case 'Spending Consistency':
        if (factor.status === 'poor' || factor.status === 'fair') {
          recommendations.push('Create a monthly budget to maintain consistent spending patterns');
        }
        break;
      case 'Income Diversification':
        if (factor.status === 'poor' || factor.status === 'fair') {
          recommendations.push('Consider developing additional income streams to reduce financial risk');
        }
        break;
      case 'Tracking Activity':
        if (factor.status === 'poor' || factor.status === 'fair') {
          recommendations.push('Record your transactions regularly to maintain better financial awareness');
        }
        break;
    }
  });

  return recommendations;
};

module.exports = {
  getDashboardAnalytics,
  getSpendingAnalytics,
  getIncomeVsExpenseTrends,
  getBudgetAnalysis,
  getFinancialHealthScore
};
