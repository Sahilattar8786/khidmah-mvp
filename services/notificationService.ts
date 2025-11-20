import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Track if app is in foreground
let isAppInForeground = AppState.currentState === 'active';

// Use subscription for AppState changes
const subscription = AppState.addEventListener('change', (nextAppState) => {
  isAppInForeground = nextAppState === 'active';
  console.log('📱 App state changed:', nextAppState);
});

export const notificationService = {
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('⚠️ Notification permissions not granted');
        return false;
      }

      // For Android, create a notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  /**
   * Send a local notification
   * Notifications will display based on app state and notification handler settings
   */
  async sendNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });
      console.log('📬 Notification sent:', title);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  },

  /**
   * Get notification token (for push notifications in the future)
   */
  async getToken(): Promise<string | null> {
    try {
      // For now, we'll use local notifications
      // Push notifications require Expo project configuration
      return null;
    } catch (error) {
      console.error('Error getting notification token:', error);
      return null;
    }
  },
};

