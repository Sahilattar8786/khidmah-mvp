import { db, isFirebaseConfigured } from '@/config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'user' | 'aalim';

export const roleService = {
  async setUserRole(userId: string, role: UserRole): Promise<void> {
    try {
      // Only try to set role if Firebase is configured
      if (!isFirebaseConfigured()) {
        console.log('Firebase not configured, skipping role storage. User will default to "user" role.');
        return;
      }

      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { role, createdAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      // Don't block signup if Firebase fails
      console.error('Error setting user role (non-blocking):', error);
      // Continue without throwing - user will default to "user" role
    }
  },

  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      // Only try to get role if Firebase is configured
      if (!isFirebaseConfigured()) {
        console.log('Firebase not configured, defaulting to "user" role.');
        return 'user'; // Default to user if Firebase not configured
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data().role as UserRole;
      }
      return null;
    } catch (error) {
      console.error('Error getting user role (non-blocking):', error);
      // Default to "user" if Firebase fails
      return 'user';
    }
  },
};

