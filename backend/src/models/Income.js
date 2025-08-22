const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  source: {
    type: String,
    required: [true, 'Income source is required'],
    trim: true,
    maxlength: [100, 'Source cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    enum: ['one-time', 'daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'salary',
      'freelance',
      'business',
      'investment',
      'rental',
      'pension',
      'social_security',
      'unemployment',
      'bonus',
      'commission',
      'royalty',
      'gift',
      'tax_refund',
      'other'
    ]
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  nextExpectedDate: {
    type: Date,
    required: function() {
      return this.frequency !== 'one-time';
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  employer: {
    name: String,
    address: String,
    contact: String
  },
  taxInfo: {
    isTaxable: { type: Boolean, default: true },
    taxRate: { type: Number, min: 0, max: 100 },
    deductions: [{
      type: String,
      amount: Number,
      description: String
    }]
  },
  paymentMethod: {
    type: String,
    enum: ['direct_deposit', 'check', 'cash', 'wire_transfer', 'online_payment', 'other'],
    default: 'direct_deposit'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRecurring: {
    type: Boolean,
    default: function() {
      return this.frequency !== 'one-time';
    }
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for monthly equivalent amount
incomeSchema.virtual('monthlyEquivalent').get(function() {
  const frequencyMultipliers = {
    'daily': 30,
    'weekly': 4.33,
    'bi-weekly': 2.17,
    'monthly': 1,
    'quarterly': 1/3,
    'yearly': 1/12,
    'one-time': 0
  };
  
  const multiplier = frequencyMultipliers[this.frequency] || 0;
  return this.amount * multiplier;
});

// Virtual for annual equivalent amount
incomeSchema.virtual('annualEquivalent').get(function() {
  const frequencyMultipliers = {
    'daily': 365,
    'weekly': 52,
    'bi-weekly': 26,
    'monthly': 12,
    'quarterly': 4,
    'yearly': 1,
    'one-time': 0
  };
  
  const multiplier = frequencyMultipliers[this.frequency] || 0;
  return this.amount * multiplier;
});

// Calculate next expected date based on frequency
incomeSchema.methods.calculateNextExpectedDate = function() {
  if (this.frequency === 'one-time') return null;
  
  const current = this.nextExpectedDate || this.startDate;
  const next = new Date(current);
  
  switch (this.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'bi-weekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
};

// Pre-save middleware to calculate next expected date
incomeSchema.pre('save', function(next) {
  if (this.frequency !== 'one-time' && this.isModified('frequency')) {
    this.nextExpectedDate = this.calculateNextExpectedDate();
  }
  next();
});

// Index for efficient queries
incomeSchema.index({ user: 1, startDate: -1 });
incomeSchema.index({ user: 1, category: 1 });
incomeSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Income', incomeSchema);