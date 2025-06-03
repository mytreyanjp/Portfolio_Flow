
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Added getAuth

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const firebaseStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const firebaseMessagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const firebaseAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;


if (!firebaseProjectId || firebaseProjectId === 'YOUR_PROJECT_ID_HERE' || firebaseProjectId.includes('YOUR_') || firebaseProjectId.length < 4) {
  console.warn(`\n\n*********************************************************************
WARNING: Invalid Firebase Project ID detected in environment variables.
NEXT_PUBLIC_FIREBASE_PROJECT_ID is currently: "${firebaseProjectId}"
Please ensure this is set correctly in your .env or .env.local file
and that you've restarted your development server.
Firestore operations will likely fail until this is corrected.
*********************************************************************\n\n`);
}

if (!firebaseApiKey || firebaseApiKey.includes('YOUR_') || firebaseApiKey.length < 10) { // API keys are usually longer
  console.warn(`\n\n*********************************************************************
WARNING: Invalid or missing Firebase API Key detected.
NEXT_PUBLIC_FIREBASE_API_KEY is currently: "${firebaseApiKey}"
Please ensure this is set correctly in your .env or .env.local file
and that you've restarted your development server.
Firebase Authentication will fail until this is corrected.
*********************************************************************\n\n`);
}

if (!firebaseAuthDomain || firebaseAuthDomain.includes('YOUR_') || (!firebaseAuthDomain.includes('.firebaseapp.com') && !firebaseAuthDomain.includes('localhost'))) {
    console.warn(`\n\n*********************************************************************
WARNING: Invalid or missing Firebase Auth Domain detected.
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is currently: "${firebaseAuthDomain}"
Please ensure this is set correctly in your .env or .env.local file
(e.g., your-project-id.firebaseapp.com or localhost for local emulators)
and that you've restarted your development server.
Firebase Authentication may fail until this is corrected.
*********************************************************************\n\n`);
}


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId
};

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase app:", error);
    console.error("Firebase Config used:", firebaseConfig);
    // Provide more direct feedback for API key issues if initialization itself fails
    if (error instanceof Error && error.message.toLowerCase().includes('api key')) {
        console.error("\n\nSDK INITIALIZATION FAILED. THIS OFTEN MEANS THE API KEY IS INVALID OR MISSING. DOUBLE CHECK YOUR .env FILE AND FIREBASE CONSOLE SETTINGS.\n\n");
    }
  }
} else {
  app = getApp();
  console.log("Existing Firebase app retrieved.");
}

let db;
let authInst; // Renamed to avoid conflict with exported 'auth'

try {
  if (app) {
    db = getFirestore(app);
    console.log("Firestore instance obtained successfully.");
  } else {
    throw new Error("Firebase app not initialized, cannot get Firestore.");
  }
} catch (error) {
  console.error("Error obtaining Firestore instance:", error);
}

try {
  if (app) {
    authInst = getAuth(app); // Use the local variable
    console.log("Firebase Auth instance obtained successfully.");
  } else {
    throw new Error("Firebase app not initialized, cannot get Auth.");
  }
} catch (error) {
  console.error("Error obtaining Firebase Auth instance:", error);
}


export { app, db, authInst as auth }; // Export the initialized auth instance as 'auth'

