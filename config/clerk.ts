import * as SecureStore from 'expo-secure-store';

// Replace with your Clerk publishable key from https://dashboard.clerk.com
// Get it from: Your App → API Keys → Publishable Key
export const CLERK_PUBLISHABLE_KEY = 'pk_test_dG91Y2hpbmctZG9yeS02NS5jbGVyay5hY2NvdW50cy5kZXYk';

// Token cache implementation using Expo SecureStore
export const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },

  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('SecureStore save item error: ', err);
      return;
    }
  },
};

export const clerkConfig = {
  publishableKey: CLERK_PUBLISHABLE_KEY,
  tokenCache,
};
