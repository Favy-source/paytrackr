const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 50 },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email'],
  },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  avatar: { type: String, default: null },

  // OAuth
  googleId: { type: String, default: null, index: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },

  preferences: {
    currency: { type: String, default: 'USD', enum: ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'] },
    notifications: {
      billReminders: { type: Boolean, default: true },
      budgetAlerts: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true },
    },
    budgetLimits: {
      monthly: { type: Number, default: 0 },
      categories: [{ name: String, limit: Number }],
    },
  },

  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  points: { type: Number, default: 0, min: 0 },
  referralStats: {
    totalReferred: { type: Number, default: 0 },
    totalPointsEarned: { type: Number, default: 0 },
    lastReferralDate: { type: Date, default: null },
  },

  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtuals
userSchema.virtual('bills', { ref: 'Bill', localField: '_id', foreignField: 'user' });
userSchema.virtual('transactions', { ref: 'Transaction', localField: '_id', foreignField: 'user' });
userSchema.virtual('income', { ref: 'Income', localField: '_id', foreignField: 'user' });

// Hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (e) { next(e); }
});

// Instance methods
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};
userSchema.methods.generateReferralCode = function() {
  if (!this.referralCode) this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  return this.referralCode;
};
userSchema.methods.addPoints = function(points, reason = 'referral') {
  this.points += points;
  if (reason === 'referral') this.referralStats.totalPointsEarned += points;
  return this.save({ validateBeforeSave: false });
};

// Static
userSchema.statics.processReferral = async function(newUserId, code) {
  if (!code) return null;
  const referrer = await this.findOne({ referralCode: code });
  if (!referrer) return null;

  await this.findByIdAndUpdate(newUserId, { referredBy: referrer._id });
  await this.findByIdAndUpdate(referrer._id, {
    $inc: {
      points: 100,
      'referralStats.totalReferred': 1,
      'referralStats.totalPointsEarned': 100,
    },
    'referralStats.lastReferralDate': new Date(),
  });

  return referrer;
};

module.exports = mongoose.model('User', userSchema);
