// backend/src/controllers/billsController.js
const { validationResult } = require('express-validator');
const Bill = require('../models/Bill');

/**
 * Build a safe pagination + sort object
 */
function buildListParams(query) {
  const {
    sortBy = 'dueDate',
    sortOrder = 'asc',
    page = 1,
    limit = 10,
  } = query;

  const safeSortBy = ['dueDate', 'amount', 'createdAt', 'updatedAt', 'status', 'title'].includes(sortBy)
    ? sortBy
    : 'dueDate';
  const safeSortOrder = sortOrder === 'desc' ? -1 : 1;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  return {
    sort: { [safeSortBy]: safeSortOrder },
    page: pageNum,
    limit: lim,
    skip: (pageNum - 1) * lim,
  };
}

/**
 * GET /api/bills
 * List bills (filter/search/paginate)
 */
const getBills = async (req, res) => {
  try {
    const {
      status,
      category,
      frequency,
      search,
      minAmount,
      maxAmount,
      from, // ISO date
      to,   // ISO date
    } = req.query;

    const { sort, page, limit, skip } = buildListParams(req.query);

    // Base query: user + active
    const q = { user: req.user.id, isActive: true };

    if (status) q.status = status;
    if (category) q.category = category;          // include 'custom' as valid
    if (frequency) q.frequency = frequency;

    // Amount range
    if (minAmount || maxAmount) {
      q.amount = {};
      if (minAmount) q.amount.$gte = Number(minAmount);
      if (maxAmount) q.amount.$lte = Number(maxAmount);
    }

    // Date range (dueDate)
    if (from || to) {
      q.dueDate = {};
      if (from) q.dueDate.$gte = new Date(from);
      if (to) q.dueDate.$lte = new Date(to);
    }

    // Search in title / description / customLabel
    if (search) {
      const rx = { $regex: search, $options: 'i' };
      q.$or = [{ title: rx }, { description: rx }, { customLabel: rx }];
    }

    const [items, total] = await Promise.all([
      Bill.find(q).sort(sort).skip(skip).limit(limit).exec(),
      Bill.countDocuments(q),
    ]);

    res.status(200).json({
      status: 'success',
      results: items.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: items,
    });
  } catch (err) {
    console.error('Get bills error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to get bills' });
  }
};

/**
 * GET /api/bills/:id
 * Read one bill
 */
const getBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true,
    });

    if (!bill) {
      return res.status(404).json({ status: 'error', message: 'Bill not found' });
    }

    res.status(200).json({ status: 'success', data: bill });
  } catch (err) {
    console.error('Get bill error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to get bill' });
  }
};

/**
 * POST /api/bills
 * Create
 * Supports category 'custom' with `customLabel`.
 */
const createBill = async (req, res) => {
  try {
    // express-validator results (if you added validators in routes)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
    }

    const {
      title,
      description,
      amount,
      category,
      customLabel, // NEW
      dueDate,
      frequency = 'monthly',
      status = 'pending',
      paymentMethod = 'other',
      reminderSettings = { enabled: true, daysBefore: 3 },
      notes,
    } = req.body;

    // Require customLabel if category === 'custom'
    if (category === 'custom' && !customLabel?.trim()) {
      return res.status(400).json({ status: 'error', message: 'customLabel is required when category is "custom"' });
    }

    const bill = await Bill.create({
      user: req.user.id,
      title,
      description,
      amount,
      category,
      customLabel: category === 'custom' ? customLabel.trim() : undefined,
      dueDate,
      frequency,
      status,
      paymentMethod,
      reminderSettings,
      notes,
    });

    res.status(201).json({ status: 'success', message: 'Bill created successfully', data: bill });
  } catch (err) {
    console.error('Create bill error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create bill' });
  }
};

/**
 * PUT /api/bills/:id
 * Update (keeps customLabel logic)
 */
const updateBill = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
    }

    const updates = { ...req.body };

    // Enforce customLabel rule
    if (updates.category === 'custom' && !updates.customLabel?.trim()) {
      return res.status(400).json({ status: 'error', message: 'customLabel is required when category is "custom"' });
    }
    // If category changed from custom to something else, drop customLabel
    if (updates.category && updates.category !== 'custom') {
      updates.customLabel = undefined;
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, isActive: true },
      updates,
      { new: true, runValidators: true }
    );

    if (!bill) {
      return res.status(404).json({ status: 'error', message: 'Bill not found' });
    }

    res.status(200).json({ status: 'success', message: 'Bill updated successfully', data: bill });
  } catch (err) {
    console.error('Update bill error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update bill' });
  }
};

/**
 * PUT /api/bills/:id/pay
 * Mark as paid (+append to paymentHistory)
 */
const markBillAsPaid = async (req, res) => {
  try {
    const { amount, paymentMethod, notes } = req.body;

    const bill = await Bill.findOne({ _id: req.params.id, user: req.user.id, isActive: true });
    if (!bill) {
      return res.status(404).json({ status: 'error', message: 'Bill not found' });
    }

    bill.paymentHistory.push({
      paidDate: new Date(),
      amount: typeof amount === 'number' ? amount : bill.amount,
      method: paymentMethod || bill.paymentMethod,
      notes,
    });

    bill.status = 'paid';
    await bill.save();

    res.status(200).json({ status: 'success', message: 'Bill marked as paid', data: bill });
  } catch (err) {
    console.error('Mark bill as paid error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to mark bill as paid' });
  }
};

/**
 * DELETE /api/bills/:id
 * Soft delete (isActive=false)
 */
const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ status: 'error', message: 'Bill not found' });
    }

    res.status(200).json({ status: 'success', message: 'Bill deleted successfully' });
  } catch (err) {
    console.error('Delete bill error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete bill' });
  }
};

/**
 * GET /api/bills/upcoming?days=7
 * Pending bills due within N days
 */
const getUpcomingBills = async (req, res) => {
  try {
    const days = Math.max(parseInt(req.query.days, 10) || 7, 1);
    const until = new Date();
    until.setDate(until.getDate() + days);

    const bills = await Bill.find({
      user: req.user.id,
      isActive: true,
      status: 'pending',
      dueDate: { $lte: until },
    }).sort({ dueDate: 1 });

    res.status(200).json({ status: 'success', results: bills.length, data: bills });
  } catch (err) {
    console.error('Get upcoming bills error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to get upcoming bills' });
  }
};

/**
 * GET /api/bills/summary
 * Quick stats by status + small KPIs
 */
const getBillsSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const [byStatus, overdueCount, upcomingCount] = await Promise.all([
      Bill.aggregate([
        { $match: { user: Bill.db.castObjectId(userId), isActive: true } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
      Bill.countDocuments({ user: userId, isActive: true, status: 'overdue' }),
      Bill.countDocuments({
        user: userId,
        isActive: true,
        status: 'pending',
        dueDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        summary: byStatus,
        overdueBills: overdueCount,
        upcomingBills: upcomingCount,
      },
    });
  } catch (err) {
    console.error('Get bills summary error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to get bills summary' });
  }
};

module.exports = {
  getBills,
  getBill,
  createBill,
  updateBill,
  markBillAsPaid,
  deleteBill,
  getUpcomingBills,
  getBillsSummary,
};
