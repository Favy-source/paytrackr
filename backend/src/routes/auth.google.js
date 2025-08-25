// backend/src/routes/auth.google.js
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // <-- import, don't redefine!

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      preferences: user.preferences,
      referralCode: user.referralCode,
      points: user.points,
      referralStats: user.referralStats,
      createdAt: user.createdAt,
    }
  });
};

// POST /api/auth/google  { idToken }
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ status: 'error', message: 'idToken is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId, email_verified } = payload;

    if (!email_verified) {
      return res.status(401).json({ status: 'error', message: 'Google email not verified' });
    }

    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      user = await User.create({
        name: name || 'Google User',
        email,
        avatar: picture || null,
        googleId,
        authProvider: 'google',
        // dummy password to satisfy schema; not used for Google users
        password: Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2),
      });
      user.generateReferralCode?.();
      await user.updateLastLogin?.();
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (!user.avatar && picture) user.avatar = picture;
        await user.save();
      }
      await user.updateLastLogin?.();
    }

    return sendTokenResponse(user, 200, res);
  } catch (e) {
    console.error('Google auth error:', e);
    return res.status(401).json({ status: 'error', message: 'Invalid Google token' });
  }
});

module.exports = router;
