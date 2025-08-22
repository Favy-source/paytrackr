const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD']
    },
    notifications: {
      billReminders: { type: Boolean, default: true },
      budgetAlerts: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true }
    },
    budgetLimits: {
      monthly: { type: Number, default: 0 },
      categories: [{
        name: String,
        limit: Number
      }]
    }
  },
  // Referral System
  referralCode: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  referralStats: {
    totalReferred: { type: Number, default: 0 },
    totalPointsEarned: { type: Number, default: 0 },
    lastReferralDate: { type: Date, default: null }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's bills
userSchema.virtual('bills', {
  ref: 'Bill',
  localField: '_id',
  foreignField: 'user'
});

// Virtual for user's transactions
userSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'user'
});

// Virtual for user's income
userSchema.virtual('income', {
  ref: 'Income',
  localField: '_id',
  foreignField: 'user'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Instance method to generate referral code
userSchema.methods.generateReferralCode = function() {
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  return this.referralCode;
};

// Instance method to add points
userSchema.methods.addPoints = function(points, reason = 'referral') {
  this.points += points;
  if (reason === 'referral') {
    this.referralStats.totalPointsEarned += points;
  }
  return this.save({ validateBeforeSave: false });
};

// Static method to process referral
userSchema.statics.processReferral = async function(newUserId, referralCode) {
  if (!referralCode) return null;
  
  const referrer = await this.findOne({ referralCode });
  if (!referrer) return null;
  
  // Update new user
  await this.findByIdAndUpdate(newUserId, { 
    referredBy: referrer._id 
  });
  
  // Update referrer
  await this.findByIdAndUpdate(referrer._id, {
    $inc: { 
      points: 100,
      'referralStats.totalReferred': 1,
      'referralStats.totalPointsEarned': 100
    },
    'referralStats.lastReferralDate': new Date()
  });
  
  return referrer;
};

module.exports = mongoose.model('User', userSchema);