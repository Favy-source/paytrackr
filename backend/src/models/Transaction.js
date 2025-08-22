const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['income', 'expense'],
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
      // Income categories
      'salary',
      'freelance',
      'business',
      'investment',
      'rental',
      'gift',
      'bonus',
      'other_income',
      // Expense categories
      'food',
      'transportation',
      'housing',
      'utilities',
      'healthcare',
      'education',
      'entertainment',
      'shopping',
      'travel',
      'insurance',
      'debt_payment',
      'savings',
      'investment_expense',
      'other_expense'
    ]
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'online', 'check', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  receipt: {
    url: String,
    filename: String
  },
  relatedBill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    nextDate: Date,
    endDate: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted amount based on type
transactionSchema.virtual('formattedAmount').get(function() {
  return this.type === 'expense' ? -this.amount : this.amount;
});

// Pre-save middleware for validation
transactionSchema.pre('save', function(next) {
  // Validate category based on type
  const incomeCategories = ['salary', 'freelance', 'business', 'investment', 'rental', 'gift', 'bonus', 'other_income'];
  const expenseCategories = ['food', 'transportation', 'housing', 'utilities', 'healthcare', 'education', 'entertainment', 'shopping', 'travel', 'insurance', 'debt_payment', 'savings', 'investment_expense', 'other_expense'];
  
  if (this.type === 'income' && !incomeCategories.includes(this.category)) {
    return next(new Error('Invalid category for income transaction'));
  }
  
  if (this.type === 'expense' && !expenseCategories.includes(this.category)) {
    return next(new Error('Invalid category for expense transaction'));
  }
  
  next();
});

// Static method to get expense categories
transactionSchema.statics.getExpenseCategories = function() {
  return ['food', 'transportation', 'housing', 'utilities', 'healthcare', 'education', 'entertainment', 'shopping', 'travel', 'insurance', 'debt_payment', 'savings', 'investment_expense', 'other_expense'];
};

// Static method to get income categories
transactionSchema.statics.getIncomeCategories = function() {
  return ['salary', 'freelance', 'business', 'investment', 'rental', 'gift', 'bonus', 'other_income'];
};

// Index for efficient queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);