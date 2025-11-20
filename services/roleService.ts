import { db, isFirebaseConfigured } from '@/config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'user' | 'aalim';

export const roleService = {
  /**
   * Set user role in both Clerk public metadata and Firebase
   * Clerk metadata is primary source for fast access
   * Firebase is backup/data storage
   */
  async setUserRole(userId: string, role: UserRole, user?: any): Promise<void> {
    try {
      // Set in Clerk public metadata (primary source)
      if (user) {
        try {
          await user.update({
            publicMetadata: {
              role: role,
            },
          });
          console.log(`✅ Role "${role}" set in Clerk public metadata`);
        } catch (clerkError) {
          console.error('Error setting role in Clerk metadata (non-blocking):', clerkError);
          // Continue to Firebase even if Clerk fails
        }
      }

      // Also store in Firebase as backup/data storage
      if (isFirebaseConfigured()) {
        try {
          const userRef = doc(db, 'users', userId);
          await setDoc(userRef, { role, createdAt: new Date().toISOString() }, { merge: true });
          console.log(`✅ Role "${role}" stored in Firebase`);
        } catch (firebaseError) {
          console.error('Error setting role in Firebase (non-blocking):', firebaseError);
        }
      }
    } catch (error) {
      // Don't block signup if role setting fails
      console.error('Error setting user role (non-blocking):', error);
      // Continue without throwing - user will default to "user" role
    }
  },

  /**
   * Get user role - checks Clerk metadata first, then Firebase
   */
  async getUserRole(userId: string, user?: any): Promise<UserRole | null> {
    try {
      // First, try to get from Clerk public metadata (fastest)
      if (user?.publicMetadata?.role) {
        const role = user.publicMetadata.role as UserRole;
        console.log('Role found in Clerk metadata:', role);
        return role;
      }

      // Fallback to Firebase if not in Clerk metadata
      if (isFirebaseConfigured()) {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const role = userSnap.data().role as UserRole;
          console.log('Role found in Firebase:', role);
          
          // Sync to Clerk metadata if found in Firebase but not in Clerk
          if (role && user) {
            try {
              await user.update({
                publicMetadata: {
                  role: role,
                },
              });
              console.log('✅ Synced role from Firebase to Clerk metadata');
            } catch (syncError) {
              console.error('Error syncing role to Clerk (non-blocking):', syncError);
            }
          }
          
          return role;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user role (non-blocking):', error);
      // Default to "user" if both fail
      return 'user';
    }
  },
};

