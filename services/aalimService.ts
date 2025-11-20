import { db, isFirebaseConfigured } from '@/config/firebase';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

export interface Aalim {
  id: string;
  clerkId: string;
  email?: string;
  name?: string;
  isAvailable: boolean;
  createdAt: any;
}

export const aalimService = {
  /**
   * Register an aalim in Firebase when they sign up
   * This allows us to query available aalims for chat assignment
   */
  async registerAalim(clerkId: string, email?: string, name?: string): Promise<void> {
    if (!isFirebaseConfigured()) {
      console.log('Firebase not configured, skipping aalim registration');
      return;
    }

    try {
      const aalimRef = doc(db, 'aalims', clerkId);
      await setDoc(aalimRef, {
        clerkId,
        email,
        name,
        isAvailable: true,
        createdAt: new Date().toISOString(),
      }, { merge: true });
      console.log('✅ Aalim registered in Firebase');
    } catch (error) {
      console.error('Error registering aalim:', error);
    }
  },

  /**
   * Get available aalims for chat assignment
   * Returns list of aalims who are available to take chats
   */
  async getAvailableAalims(): Promise<Aalim[]> {
    if (!isFirebaseConfigured()) {
      console.log('Firebase not configured, returning empty aalim list');
      return [];
    }

    try {
      const aalimsRef = collection(db, 'aalims');
      const q = query(aalimsRef, where('isAvailable', '==', true));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Aalim[];
    } catch (error) {
      console.error('Error getting available aalims:', error);
      return [];
    }
  },

  /**
   * Assign an aalim to a chat
   * For MVP: Simple round-robin or first available
   * For production: Implement load balancing, availability, etc.
   */
  async assignAalimToChat(): Promise<string | null> {
    try {
      const availableAalims = await this.getAvailableAalims();
      
      if (availableAalims.length === 0) {
        console.log('No available aalims found');
        return null;
      }

      // Simple assignment: first available aalim
      // For production, implement better logic (round-robin, load balancing, etc.)
      const assignedAalim = availableAalims[0];
      console.log('Assigned aalim:', assignedAalim.clerkId);
      return assignedAalim.clerkId;
    } catch (error) {
      console.error('Error assigning aalim:', error);
      return null;
    }
  },

  /**
   * Check if an aalim is registered in Firebase
   * Returns true if aalim exists in Firebase, false otherwise
   */
  async isAalimRegistered(clerkId: string): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      return false;
    }

    try {
      const aalimRef = doc(db, 'aalims', clerkId);
      const aalimSnap = await getDoc(aalimRef);
      return aalimSnap.exists();
    } catch (error) {
      console.error('Error checking aalim registration:', error);
      return false;
    }
  },

  /**
   * Update aalim availability status
   */
  async updateAalimAvailability(clerkId: string, isAvailable: boolean): Promise<void> {
    if (!isFirebaseConfigured()) {
      return;
    }

    try {
      const aalimRef = doc(db, 'aalims', clerkId);
      await setDoc(aalimRef, {
        isAvailable,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating aalim availability:', error);
    }
  },
};

