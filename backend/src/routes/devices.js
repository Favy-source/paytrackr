// backend/src/routes/devices.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.post('/expo', authenticateToken, async (req, res) => {
  const { token } = req.body; // Expo push token
  if (!token) return res.status(400).json({ status: 'error', message: 'token required' });
  await User.updateOne(
    { _id: req.user.id },
    { $addToSet: { expoPushTokens: token } } // prevent duplicates
  );
  res.json({ status: 'success' });
});

module.exports = router;
