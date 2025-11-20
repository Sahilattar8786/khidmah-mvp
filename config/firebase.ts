import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your Firebase config from Firebase Console
// Go to: Project Settings → General → Your apps → Firebase SDK snippet → Config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase only if not already initialized
let app;
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Create a dummy app to prevent crashes
    app = initializeApp({
      apiKey: "dummy",
      authDomain: "dummy.firebaseapp.com",
      projectId: "dummy",
      storageBucket: "dummy.appspot.com",
      messagingSenderId: "123456789",
      appId: "dummy"
    });
  }
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const auth = getAuth(app);

