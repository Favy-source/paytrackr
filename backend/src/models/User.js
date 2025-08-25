// backend/src/models/User.js
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
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // hide by default
  },

  // Profile
  avatar: { type: String, default: null },

  // Preferences
  preferences: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD']
    },
    notifications: {
      billReminders: { type: Boolean, default: true },
      budgetAlerts:  { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true }
    },
    budgetLimits: {
      monthly: { type: Number, default: 0 },
      categories: [{ name: String, limit: Number }]
    }
  },

  // OAuth / Identity
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: { type: String, index: true },

  // Push notifications (Expo)
  expoPushTokens: { type: [String], default: [] },

  // Referral System
  referralCode: {
    type: String,
    unique: true,
    sparse: true // allows multiple undefined
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  points: { type: Number, default: 0, min: 0 },
  referralStats: {
    totalReferred: { type: Number, default: 0 },
    totalPointsEarned: { type: Number, default: 0 },
    lastReferralDate: { type: Date, default: null }
  },

  // Account state
  isActive:  { type: Boolean, default: true },
  lastLogin: { type: Date, default: null }
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform(doc, ret) { delete ret.password; return ret; } },
  toObject: { virtuals: true }
});

/* =======================
   Virtual Relations
======================= */
userSchema.virtual('bills', {
  ref: 'Bill',
  localField: '_id',
  foreignField: 'user'
});
userSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'user'
});
userSchema.virtual('income', {
  ref: 'Income',
  localField: '_id',
  foreignField: 'user'
});

/* =======================
   Hooks
======================= */
userSchema.pre('save', async function(next) {
  // hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  // ensure referral code exists
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  return next();
});

/* =======================
   Instance Methods
======================= */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.generateReferralCode = function() {
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  return this.referralCode;
};

userSchema.methods.addPoints = function(points, reason = 'referral') {
  this.points += points;
  if (reason === 'referral') {
    this.referralStats.totalPointsEarned += points;
  }
  return this.save({ validateBeforeSave: false });
};

/* =======================
   Statics
======================= */
userSchema.statics.processReferral = async function(newUserId, referralCode) {
  if (!referralCode) return null;

  const referrer = await this.findOne({ referralCode });
  if (!referrer) return null;

  // link new user
  await this.findByIdAndUpdate(newUserId, { referredBy: referrer._id });

  // reward referrer
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

/* =======================
   Indexes
======================= */
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 });

module.exports = mongoose.model('User', userSchema);
