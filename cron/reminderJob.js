// cron/reminderJob.js
const cron = require('node-cron');
const Bill = require('../models/Bill');
const User = require('../models/User');
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

// Run every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily reminder job...');
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 3); // look ahead 3 days

  const bills = await Bill.find({
    isActive: true,
    status: 'pending',
    dueDate: { $lte: futureDate },
  }).populate('user');

  const messages = [];
  for (const bill of bills) {
    const pushToken = bill.user.expoPushToken; // store this on user registration
    if (!Expo.isExpoPushToken(pushToken)) continue;

    messages.push({
      to: pushToken,
      sound: 'default',
      title: 'Bill Reminder',
      body: `${bill.title} is due on ${bill.dueDate.toDateString()}`,
      data: { billId: bill._id },
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('Push error:', error);
    }
  }
});
