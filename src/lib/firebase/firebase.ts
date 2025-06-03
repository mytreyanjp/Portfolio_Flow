
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
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

const CRITICAL_ERROR_PREFIX = "CRITICAL FIREBASE CONFIG ERROR:";

if (!firebaseProjectId || firebaseProjectId === 'YOUR_PROJECT_ID_HERE' || firebaseProjectId.includes('YOUR_') || firebaseProjectId.length < 4) {
  const message = `${CRITICAL_ERROR_PREFIX} Invalid or missing Firebase Project ID. NEXT_PUBLIC_FIREBASE_PROJECT_ID is currently: "${firebaseProjectId}". Please ensure this is set correctly in your environment variables for the deployed environment.`;
  console.error(message);
  throw new Error(message);
}

if (!firebaseApiKey || firebaseApiKey.includes('YOUR_') || firebaseApiKey.length < 10) { // API keys are usually longer
  const message = `${CRITICAL_ERROR_PREFIX} Invalid or missing Firebase API Key. NEXT_PUBLIC_FIREBASE_API_KEY is currently: "${firebaseApiKey}". Please ensure this is set correctly for the deployed environment.`;
  console.error(message);
  throw new Error(message);
}

if (!firebaseAuthDomain || firebaseAuthDomain.includes('YOUR_') || (!firebaseAuthDomain.includes('.firebaseapp.com') && !firebaseAuthDomain.includes('localhost') && !firebaseAuthDomain.includes('.web.app'))) {
  const message = `${CRITICAL_ERROR_PREFIX} Invalid or missing Firebase Auth Domain. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is currently: "${firebaseAuthDomain}". It should typically be 'YOUR_PROJECT_ID.firebaseapp.com', 'YOUR_PROJECT_ID.web.app', or 'localhost' for local development.`;
  console.error(message);
  throw new Error(message);
}

if (!firebaseAppId || firebaseAppId.includes('YOUR_') || !firebaseAppId.startsWith('1:') || firebaseAppId.split(':').length < 3) {
  const message = `${CRITICAL_ERROR_PREFIX} Invalid or missing Firebase App ID. NEXT_PUBLIC_FIREBASE_APP_ID is currently: "${firebaseAppId}". It should be in the format '1:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXXXXXXXX'.`;
  console.error(message);
  throw new Error(message);
}


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId
};

// Log the config being used for initialization
console.log("Firebase Config for Initialization in firebase.ts:", JSON.stringify(firebaseConfig, null, 2));

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully in firebase.ts using the logged config above.");
    if (app.options.authDomain) {
        console.log(`Initialized Firebase App in firebase.ts - authDomain from app.options: ${app.options.authDomain}, projectId: ${app.options.projectId}`);
    } else {
        console.warn("Initialized Firebase App in firebase.ts - authDomain from app.options is undefined/empty.");
    }
  } catch (error) {
    console.error("Error initializing Firebase app in firebase.ts:", error);
    console.error("Firebase Config used at initialization in firebase.ts:", firebaseConfig);
    if (error instanceof Error && (error.message.toLowerCase().includes('api key') || error.message.toLowerCase().includes('project id') || error.message.toLowerCase().includes('auth domain') || error.message.toLowerCase().includes('app id'))) {
        console.error("\n\nSDK INITIALIZATION FAILED. THIS OFTEN MEANS ONE OF THE CRITICAL FIREBASE CONFIG VALUES (API KEY, PROJECT ID, AUTH DOMAIN, APP ID) IS INVALID OR MISSING. DOUBLE CHECK YOUR ENVIRONMENT VARIABLES AND FIREBASE CONSOLE SETTINGS.\n\n");
    }
    throw error; // Re-throw the initialization error to make it more visible
  }
} else {
  app = getApp();
  console.log("Existing Firebase app retrieved in firebase.ts.");
   if (app.options.authDomain) {
        console.log(`Retrieved Firebase App in firebase.ts - authDomain from app.options: ${app.options.authDomain}, projectId: ${app.options.projectId}`);
    } else {
        console.warn("Retrieved Firebase App in firebase.ts - authDomain from app.options is undefined/empty.");
    }
}

let db;
let authInst; // Renamed to avoid conflict with exported 'auth'

try {
  if (app) {
    db = getFirestore(app);
    // console.log("Firestore instance obtained successfully."); // Reduced verbosity
  } else {
    // This case should ideally be caught by app initialization failure
    const message = "Firebase app not initialized, cannot get Firestore.";
    console.error(message);
    throw new Error(message);
  }
} catch (error) {
  console.error("Error obtaining Firestore instance:", error);
  throw error; // Re-throw
}

try {
  if (app) {
    authInst = getAuth(app); // Use the local variable
    // console.log("Firebase Auth instance obtained successfully."); // Reduced verbosity
  } else {
     // This case should ideally be caught by app initialization failure
    const message = "Firebase app not initialized, cannot get Auth.";
    console.error(message);
    throw new Error(message);
  }
} catch (error) {
  console.error("Error obtaining Firebase Auth instance:", error);
  throw error; // Re-throw
}


export { app, db, authInst as auth }; // Export the initialized auth instance as 'auth'
