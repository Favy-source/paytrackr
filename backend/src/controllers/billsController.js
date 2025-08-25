// backend/src/controllers/billsController.js
const { validationResult } = require('express-validator');
const Bill = require('../models/Bill');

// @desc    Get all bills for user
// @route   GET /api/bills
// @access  Private
const getBills = async (req, res) => {
  try {
    const {
      status,
      category,
      frequency,
      sortBy = 'dueDate',
      sortOrder = 'asc',
      page = 1,
      limit = 10,
      search
    } = req.query;

    const query = { user: req.user.id, isActive: true };

    if (status) query.status = status;
    if (category) query.category = category;
    if (frequency) query.frequency = frequency;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { customLabel: { $regex: search, $options: 'i' } } // 👈 include customLabel
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const bills = await Bill.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Bill.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: bills.length,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      },
      data: bills
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get bills' });
  }
};

// @desc    Get single bill
// @route   GET /api/bills/:id
// @access  Private
const getBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!bill) {
      return res.status(404).json({ status: 'error', message: 'Bill not found' });
    }

    res.status(200).json({ status: 'success', data: bill });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get bill' });
  }
};

// @desc    Create new bill
// @route   POST /api/bills
// @access  Private
const createBill = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const billData = {
      ...req.body,
      user: req.user.id
    };

    // ✅ Ensure customLabel comes through when category is "custom"
    if (billData.category === 'custom' && !billData.customLabel) {
      return res.status(400).json({
        status: 'error',
        message: 'Custom label is required when category is "custom"'
      });
    }

    const bill = new Bill(billData);
    await bill.save();

    res.status(201).json({
      status: 'success',
      message: 'Bill created successfully',
      data: bill
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create bill' });
  }
};

// @desc    Update bill
// @route   PUT /api/bills/:id
// @access  Private
const updateBill = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // ✅ Same validation for update
    if (req.body.category === 'custom' && !req.body.customLabel) {
      return res.status(400).json({
        status: 'error',
        message: 'Custom label is required when category is "custom"'
      });
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!bill) {
      return res.status(404).json({ status: 'error', message: 'Bill not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Bill updated successfully',
      data: bill
    });
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update bill' });
  }
};

// @desc    Mark bill as paid
// @route   PUT /api/bills/:id/pay
// @access  Private
const markBillAsPaid = async (req, res) => {
  try {
    const { amount, paymentMethod, notes } = req.body;

    const bill = await Bill.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!bill) {
      return res.status(404).json({ status: 'error', message: 'Bill not found' });
    }

    bill.paymentHistory.push({
      paidDate: new Date(),
      amount: amount || bill.amount,
      method: paymentMethod || bill.paymentMethod,
      notes
    });

    bill.status = 'paid';
    await bill.save();

    res.status(200).json({
      status: 'success',
      message: 'Bill marked as paid',
      data: bill
    });
  } catch (error) {
    console.error('Mark bill as paid error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to mark bill as paid' });
  }
};

// @desc    Delete bill (soft delete)
// @route   DELETE /api/bills/:id
// @access  Private
const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ status: 'error', message: 'Bill not found' });
    }

    res.status(200).json({ status: 'success', message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete bill' });
  }
};

// @desc    Get upcoming bills
// @route   GET /api/bills/upcoming
// @access  Private
const getUpcomingBills = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const bills = await Bill.find({
      user: req.user.id,
      isActive: true,
      status: 'pending',
      dueDate: { $lte: futureDate }
    }).sort({ dueDate: 1 });

    res.status(200).json({
      status: 'success',
      results: bills.length,
      data: bills
    });
  } catch (error) {
    console.error('Get upcoming bills error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get upcoming bills' });
  }
};

// @desc    Get bills summary
// @route   GET /api/bills/summary
// @access  Private
const getBillsSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const summary = await Bill.aggregate([
      { $match: { user: userId, isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const overdueBills = await Bill.countDocuments({
      user: userId,
      isActive: true,
      status: 'overdue'
    });

    const upcomingBills = await Bill.countDocuments({
      user: userId,
      isActive: true,
      status: 'pending',
      dueDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });

    res.status(200).json({
      status: 'success',
      data: { summary, overdueBills, upcomingBills }
    });
  } catch (error) {
    console.error('Get bills summary error:', error);
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
  getBillsSummary
};
