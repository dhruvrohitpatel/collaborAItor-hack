import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | null = null;

export function getFirebaseApp() {
  if (!isFirebaseConfigured) return null;

  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }

  return app;
}

export function getFirebaseAuth() {
  const configuredApp = getFirebaseApp();
  if (!configuredApp) return null;

  return getAuth(configuredApp);
}

export function getGoogleProvider() {
  if (!isFirebaseConfigured) return null;
  return new GoogleAuthProvider();
}

// TODO: Replace mock auth UI with Firebase Auth pop-up/sign-in flows for production.
