// backend/src/models/Bill.js
const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  title: {
    type: String,
    required: [true, 'Bill title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'utilities',
      'rent',
      'insurance',
      'subscriptions',
      'internet',
      'phone',
      'food',
      'transportation',
      'healthcare',
      'entertainment',
      'other',
      'custom'              // 👈 allow custom category
    ]
  },
  // 👇 optional label users can type when category === 'custom'
  customLabel: {
    type: String,
    trim: true,
    maxlength: [40, 'Custom label cannot exceed 40 characters'],
    default: undefined
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    enum: ['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'online', 'check', 'other'],
    default: 'other'
  },
  reminderSettings: {
    enabled: { type: Boolean, default: true },
    daysBefore: { type: Number, default: 3, min: 0, max: 30 }
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  paymentHistory: [{
    paidDate: Date,
    amount: Number,
    method: String,
    notes: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Require customLabel if category is 'custom'
billSchema.pre('validate', function(next) {
  if (this.category === 'custom' && !this.customLabel) {
    this.invalidate('customLabel', 'Custom label is required when category is "custom"');
  }
  next();
});

// Virtual for days until due
billSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for overdue status
billSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && this.dueDate < new Date();
});

// Update status based on due date
billSchema.pre('save', function(next) {
  if (this.status === 'pending' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }
  next();
});

// Indexes for efficient queries
billSchema.index({ user: 1, dueDate: 1 });
billSchema.index({ user: 1, category: 1 });
billSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Bill', billSchema);
