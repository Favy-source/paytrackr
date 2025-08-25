// mobile/utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure global notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Ask for notification permissions and register the device.
 * Returns Expo push token (or null).
 */
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    alert('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await AsyncStorage.setItem('expoPushToken', token);
  console.log('Expo Push Token:', token);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

/**
 * Schedule a local reminder for a bill
 * @param {Object} bill - { title, dueDate, reminderSettings }
 */
export async function scheduleBillReminder(bill) {
  if (!bill?.reminderSettings?.enabled) return;

  const reminderDate = new Date(bill.dueDate);
  reminderDate.setDate(reminderDate.getDate() - (bill.reminderSettings.daysBefore || 0));

  // Don’t schedule if in the past
  if (reminderDate <= new Date()) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Upcoming Bill Reminder',
      body: `${bill.title} is due on ${new Date(bill.dueDate).toDateString()}`,
      data: { billId: bill.id || bill._id },
    },
    trigger: reminderDate,
  });

  console.log('Scheduled notification:', id);
  return id;
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
