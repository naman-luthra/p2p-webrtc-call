import firebase from "firebase/compat/app";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase client credentials.
 */
const clientCredentials = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

/**
 * Initializes the Firebase app with the client credentials if it hasn't been initialized already.
 */
if (!firebase.apps.length) {
  firebase.initializeApp(clientCredentials);
}

/**
 * Returns the Firestore instance.
 * @returns The Firestore instance.
 */
export const firestore = getFirestore();