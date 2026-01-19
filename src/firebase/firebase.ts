import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";
import { getFirestore, Firestore } from "firebase/firestore";

/**
 * Firebase Configuration
 * DO NOT MODIFY CONFIG VALUES - These are exact values from Firebase Console
 */
const firebaseConfig = {
  apiKey: "AIzaSyAR40dSceiosMi272iB9supALgpsKlNLxA",
  authDomain: "new-trail-dungen.firebaseapp.com",
  projectId: "new-trail-dungen",
  storageBucket: "new-trail-dungen.firebasestorage.app",
  messagingSenderId: "1056979270186",
  appId: "1:1056979270186:web:0bc18469a82db5fc456153",
  measurementId: "G-8TWYNF7VRX"
};

// Initialize Firebase App
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (only in browser environment)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

// Initialize Firebase Services
export const auth: Auth = getAuth(app);
export const database: Database = getDatabase(app);
export const firestore: Firestore = getFirestore(app);

// Export Firebase App instance
export { app };

// Log successful initialization
console.log("✅ Firebase initialized successfully");
console.log("✅ Firebase Auth initialized with domain:", auth.app.options.authDomain);
