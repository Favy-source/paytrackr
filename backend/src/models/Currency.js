const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    uppercase: true,
    minlength: 3,
    maxlength: 3,
  },
  name: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  exchangeRate: {
    type: Number,
    required: true,
    default: 1.0,
  },
  isBaseCurrency: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// User currency preferences
const userCurrencyPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  primaryCurrency: {
    code: {
      type: String,
      required: true,
      default: 'USD',
    },
    symbol: {
      type: String,
      required: true,
      default: '$',
    },
  },
  displayCurrencies: [{
    code: String,
    symbol: String,
  }],
  autoConvert: {
    type: Boolean,
    default: true,
  },
  showMultipleCurrencies: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Add index for better performance
currencySchema.index({ code: 1 });
userCurrencyPreferenceSchema.index({ userId: 1 });

// Static methods for Currency
currencySchema.statics.getBaseCurrency = function() {
  return this.findOne({ isBaseCurrency: true });
};

currencySchema.statics.getActiveCurrencies = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

currencySchema.statics.updateExchangeRates = async function(rates) {
  const updatePromises = Object.entries(rates).map(([code, rate]) => 
    this.findOneAndUpdate(
      { code: code.toUpperCase() },
      { 
        exchangeRate: rate,
        lastUpdated: new Date(),
      },
      { upsert: false }
    )
  );
  
  return Promise.all(updatePromises);
};

// Instance methods for currency conversion
currencySchema.methods.convertFromBase = function(amount) {
  return amount * this.exchangeRate;
};

currencySchema.methods.convertToBase = function(amount) {
  return amount / this.exchangeRate;
};

// Static method for UserCurrencyPreference
userCurrencyPreferenceSchema.statics.getOrCreateUserPreference = async function(userId) {
  let preference = await this.findOne({ userId });
  
  if (!preference) {
    preference = await this.create({
      userId,
      primaryCurrency: {
        code: 'USD',
        symbol: '$',
      },
    });
  }
  
  return preference;
};

// Pre-save middleware to validate currency codes
currencySchema.pre('save', async function(next) {
  if (this.isBaseCurrency) {
    // Ensure only one base currency exists
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isBaseCurrency: false }
    );
  }
  next();
});

const Currency = mongoose.model('Currency', currencySchema);
const UserCurrencyPreference = mongoose.model('UserCurrencyPreference', userCurrencyPreferenceSchema);

// Initialize default currencies
const initializeDefaultCurrencies = async () => {
  const defaultCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', isBaseCurrency: true },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  ];

  try {
    for (const currencyData of defaultCurrencies) {
      await Currency.findOneAndUpdate(
        { code: currencyData.code },
        currencyData,
        { upsert: true, new: true }
      );
    }
    console.log('✅ Default currencies initialized');
  } catch (error) {
    console.error('❌ Error initializing default currencies:', error);
  }
};

module.exports = {
  Currency,
  UserCurrencyPreference,
  initializeDefaultCurrencies,
};
