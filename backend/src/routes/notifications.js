const express = require('express');
const fetch = require('node-fetch'); // Node 18+ has global fetch; if not, add this dep
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/notifications/register
 * Body: { expoPushToken: "ExponentPushToken[...]" }
 * Saves the token on the authenticated user
 */
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    if (!expoPushToken || !/^ExponentPushToken\[/.test(expoPushToken)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Expo push token' });
    }

    await User.findByIdAndUpdate(
      req.user.id,
      { expoPushToken, lastNotifiedAt: null },
      { new: true }
    );

    return res.json({ status: 'success', message: 'Push token saved' });
  } catch (e) {
    console.error('Save push token error:', e);
    return res.status(500).json({ status: 'error', message: 'Failed to save push token' });
  }
});

/**
 * POST /api/notifications/test
 * Sends a test push notification to the logged-in user (if they have a token)
 */
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('expoPushToken name');
    if (!user?.expoPushToken) {
      return res.status(400).json({ status: 'error', message: 'No Expo push token on user' });
    }

    const message = {
      to: user.expoPushToken,
      sound: 'default',
      title: 'PayTrackr Test',
      body: `Hi${user.name ? ` ${user.name}` : ''}! Push works 🚀`,
      data: { type: 'test' },
    };

    // Send via Expo Push API
    const resp = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    const json = await resp.json();

    return res.json({ status: 'success', expoResponse: json });
  } catch (e) {
    console.error('Test push error:', e);
    return res.status(500).json({ status: 'error', message: 'Failed to send test push' });
  }
});

/**
 * DELETE /api/notifications/register
 * Clears the user’s token (e.g., on logout if you want to clean up)
 */
router.delete('/register', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $unset: { expoPushToken: 1 } });
    return res.json({ status: 'success', message: 'Push token removed' });
  } catch (e) {
    console.error('Remove token error:', e);
    return res.status(500).json({ status: 'error', message: 'Failed to remove token' });
  }
});

module.exports = router;
