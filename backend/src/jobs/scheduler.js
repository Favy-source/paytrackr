// backend/src/jobs/scheduler.js
const cron = require('node-cron');
const { Expo } = require('expo-server-sdk');
const nodemailer = require('nodemailer');
const Bill = require('../models/Bill');
const User = require('../models/User');

const expo = new Expo();

// optional SMTP (set envs to enable)
const enableEmail = !!process.env.SMTP_HOST;
const transporter = enableEmail ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USERNAME, pass: process.env.SMTP_PASSWORD }
}) : null;

function startDailyJobs() {
  // Africa/Lagos every day at 08:00
  cron.schedule('0 8 * * *', async () => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    end.setDate(end.getDate() + 1);

    // 1) Mark overdue
    await Bill.updateMany(
      { dueDate: { $lt: start }, status: { $ne: 'paid' } },
      { $set: { status: 'overdue' } }
    );

    // 2) Find upcoming bills in next 24h
    const upcoming = await Bill.find({
      dueDate: { $gte: start, $lt: end },
      status: { $in: ['unpaid','overdue'] }
    }).populate('user', 'name email expoPushTokens');

    // Group per user
    const map = new Map(); // userId -> [bills]
    for (const b of upcoming) {
      const arr = map.get(String(b.user._id)) || [];
      arr.push(b);
      map.set(String(b.user._id), arr);
    }

    // Send push + email
    for (const [userId, bills] of map.entries()) {
      const user = bills[0].user;

      // Push notifications
      const messages = (user.expoPushTokens || []).filter(Expo.isExpoPushToken).map(token => ({
        to: token,
        sound: 'default',
        title: 'Bill reminder',
        body: bills.length === 1
          ? `${bills[0].title || bills[0].customLabel} is due today`
          : `${bills.length} bills are due today`,
        data: { type: 'bill-reminder' },
      }));

      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try { await expo.sendPushNotificationsAsync(chunk); } catch {}
      }

      // Email (optional)
      if (enableEmail && user.email) {
        const lines = bills.slice(0, 5).map(b =>
          `• ${(b.category === 'custom' && b.customLabel) ? b.customLabel : b.title} – ${b.amount}`
        ).join('\n');

        try {
          await transporter.sendMail({
            from: process.env.FROM_EMAIL || process.env.SMTP_USERNAME,
            to: user.email,
            subject: 'PayTrackr – Bill reminder',
            text: `You have ${bills.length} bill(s) due soon:\n\n${lines}\n\n— PayTrackr`,
          });
        } catch {}
      }
    }
  }, { timezone: 'Africa/Lagos' });
}

module.exports = { startDailyJobs };
