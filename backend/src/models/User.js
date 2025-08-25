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
    index: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email']
  },

  // Local auth password (conditionally required)
  password: {
    type: String,
    select: false,
    minlength: [6, 'Password must be at least 6 characters long'],
    // Required only for local users
    required: function () {
      return this.authProvider === 'local';
    }
  },

  // Social auth
  googleId: {
    type: String,
    index: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
    index: true
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
    sparse: true // Allows multiple nulls
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
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.password; return ret; } },
  toObject: { virtuals: true }
});

/* ---------- Virtuals ---------- */
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

/* ---------- Hooks ---------- */
// Hash password if modified/present
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/* ---------- Instance Methods ---------- */
userSchema.methods.comparePassword = async function (candidatePassword) {
  // If user has no password (e.g., Google-only), deny local login
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.generateReferralCode = function () {
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  return this.referralCode;
};

userSchema.methods.addPoints = function (points, reason = 'referral') {
  this.points += points;
  if (reason === 'referral') {
    this.referralStats.totalPointsEarned += points;
  }
  return this.save({ validateBeforeSave: false });
};

/* ---------- Statics ---------- */
userSchema.statics.processReferral = async function (newUserId, referralCode) {
  if (!referralCode) return null;

  const referrer = await this.findOne({ referralCode });
  if (!referrer) return null;

  // Link new user
  await this.findByIdAndUpdate(newUserId, {
    referredBy: referrer._id
  });

  // Update referrer’s stats/points
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
