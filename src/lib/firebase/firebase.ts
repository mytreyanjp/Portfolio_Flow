
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!firebaseProjectId || firebaseProjectId === 'YOUR_PROJECT_ID_HERE' || firebaseProjectId.includes('YOUR_') || firebaseProjectId.length < 4) {
  console.warn(`\n\n*********************************************************************
WARNING: Invalid Firebase Project ID detected in environment variables.
NEXT_PUBLIC_FIREBASE_PROJECT_ID is currently: "${firebaseProjectId}"
Please ensure this is set correctly in your .env or .env.local file
and that you've restarted your development server.
Firestore operations will likely fail until this is corrected.
*********************************************************************\n\n`);
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseProjectId, // Use the validated variable
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
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
  }
} else {
  app = getApp();
  console.log("Existing Firebase app retrieved.");
}

let db;
try {
  db = getFirestore(app);
  console.log("Firestore instance obtained successfully.");
} catch (error) {
  console.error("Error obtaining Firestore instance:", error);
}


export { app, db };

