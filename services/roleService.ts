import { db } from '@/config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export type UserRole = 'user' | 'aalim';

export const roleService = {
  async setUserRole(userId: string, role: UserRole): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { role, createdAt: new Date().toISOString() }, { merge: true });
  },

  async getUserRole(userId: string): Promise<UserRole | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data().role as UserRole;
    }
    return null;
  },
};

