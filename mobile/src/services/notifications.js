import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async init() {
    try {
      // Request permissions
      await this.registerForPushNotificationsAsync();
      
      // Set up listeners
      this.setupListeners();
      
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  async registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permission for push notifications was denied');
      return;
    }

    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;
      
      // Store token locally
      await AsyncStorage.setItem('expoPushToken', token);
      
      console.log('Expo push token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
    }

    // Android specific setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('bills', {
        name: 'Bill Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2196F3',
      });

      await Notifications.setNotificationChannelAsync('budgets', {
        name: 'Budget Alerts',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF9800',
      });

      await Notifications.setNotificationChannelAsync('general', {
        name: 'General Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });
    }
  }

  setupListeners() {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle user tapping on notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  handleNotificationResponse(response) {
    const { notification } = response;
    const { data } = notification.request.content;

    // Handle different notification types
    switch (data?.type) {
      case 'bill_reminder':
        // Navigate to bills screen
        console.log('Navigate to bill:', data.billId);
        break;
      case 'budget_alert':
        // Navigate to budget screen
        console.log('Navigate to budget screen');
        break;
      case 'referral':
        // Navigate to referral screen
        console.log('Navigate to referral screen');
        break;
      default:
        console.log('Handle general notification');
    }
  }

  // Schedule local notifications
  async scheduleBillReminder(bill) {
    try {
      const { dueDate, name, amount } = bill;
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - 1); // Remind 1 day before

      if (reminderDate > new Date()) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Bill Reminder 💰',
            body: `${name} is due tomorrow ($${amount})`,
            data: {
              type: 'bill_reminder',
              billId: bill.id,
            },
          },
          trigger: {
            date: reminderDate,
            channelId: 'bills',
          },
        });

        console.log('Bill reminder scheduled:', notificationId);
        return notificationId;
      }
    } catch (error) {
      console.error('Error scheduling bill reminder:', error);
    }
  }

  async scheduleBudgetAlert(category, currentSpent, budgetLimit) {
    try {
      const percentage = (currentSpent / budgetLimit) * 100;
      
      if (percentage >= 80 && percentage < 100) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Budget Alert ⚠️',
            body: `You've spent ${percentage.toFixed(0)}% of your ${category} budget`,
            data: {
              type: 'budget_alert',
              category,
            },
          },
          trigger: {
            seconds: 1,
            channelId: 'budgets',
          },
        });
      } else if (percentage >= 100) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Budget Exceeded 🚨',
            body: `You've exceeded your ${category} budget by ${(percentage - 100).toFixed(0)}%`,
            data: {
              type: 'budget_alert',
              category,
            },
          },
          trigger: {
            seconds: 1,
            channelId: 'budgets',
          },
        });
      }
    } catch (error) {
      console.error('Error scheduling budget alert:', error);
    }
  }

  async sendReferralNotification(referrerName) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Referral Success! 🎉',
          body: `${referrerName} referred you to PayTrackr. You both earned 100 points!`,
          data: {
            type: 'referral',
          },
        },
        trigger: {
          seconds: 2,
          channelId: 'general',
        },
      });
    } catch (error) {
      console.error('Error sending referral notification:', error);
    }
  }

  async sendGeneralNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'general',
            ...data,
          },
        },
        trigger: {
          seconds: 1,
          channelId: 'general',
        },
      });
    } catch (error) {
      console.error('Error sending general notification:', error);
    }
  }

  // Cancel scheduled notifications
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  // Get scheduled notifications
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Clean up listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
