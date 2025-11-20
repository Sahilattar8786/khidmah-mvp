import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCn6flpCtyReKSS84Nw9mKcdlYJ2svi5GE",
  authDomain: "khidmah-mvp.firebaseapp.com",
  projectId: "khidmah-mvp",
  storageBucket: "khidmah-mvp.firebasestorage.app",
  messagingSenderId: "183488000916",
  appId: "1:183488000916:web:cad35cf2865448455fd581",
  measurementId: "G-YV9LC32N2Z"
};

// Initialize Firebase only if not already initialized
let app;
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error; // Re-throw to make it clear if Firebase fails
  }
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const auth = getAuth(app);

// Export config for checking if Firebase is configured
export const isFirebaseConfigured = () => {
  // Check if Firebase config has valid values (not placeholders)
  return firebaseConfig.projectId === 'khidmah-mvp' && 
         firebaseConfig.apiKey.startsWith('AIza');
};

