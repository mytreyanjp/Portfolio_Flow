
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Added getAuth

console.log("firebase.ts: SCRIPT EXECUTION STARTED. Next.js server is attempting to load this module.");

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const firebaseStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const firebaseMessagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const firebaseAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

console.log(`firebase.ts: Env Var - NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${firebaseProjectId}`);
console.log(`firebase.ts: Env Var - NEXT_PUBLIC_FIREBASE_API_KEY: ${firebaseApiKey ? 'Present' : 'MISSING!'}`);
console.log(`firebase.ts: Env Var - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${firebaseAuthDomain}`);
console.log(`firebase.ts: Env Var - NEXT_PUBLIC_FIREBASE_APP_ID: ${firebaseAppId}`);


const CRITICAL_ERROR_PREFIX = "CRITICAL FIREBASE CONFIG ERROR:";

if (!firebaseProjectId || firebaseProjectId === 'YOUR_PROJECT_ID_HERE' || firebaseProjectId.includes('YOUR_') || firebaseProjectId.length < 4) {
  const message = `${CRITICAL_ERROR_PREFIX} Invalid or missing Firebase Project ID. NEXT_PUBLIC_FIREBASE_PROJECT_ID is currently: "${firebaseProjectId}". Please ensure this is set correctly in your environment variables for the deployed environment.`;
  console.error(message);
  throw new Error(message);
}

if (!firebaseApiKey || firebaseApiKey.includes('YOUR_') || firebaseApiKey.length < 10) {
  const message = `${CRITICAL_ERROR_PREFIX} Invalid or missing Firebase API Key. NEXT_PUBLIC_FIREBASE_API_KEY is "REDACTED". Please ensure this is set correctly for the deployed environment.`;
  console.error(message);
  throw new Error(message);
}

if (!firebaseAuthDomain || firebaseAuthDomain.includes('YOUR_') || (!firebaseAuthDomain.includes('.firebaseapp.com') && !firebaseAuthDomain.includes('.web.app') && !firebaseAuthDomain.includes('localhost'))) {
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
// Using only the strictly necessary fields for initializeApp first.
const minimalFirebaseConfig: FirebaseOptions = {
  apiKey: firebaseApiKey!, // Non-null assertion due to checks above
  authDomain: firebaseAuthDomain!,
  projectId: firebaseProjectId!,
  appId: firebaseAppId!,
};
// Add other optional fields only if they are defined and not empty strings
if (firebaseStorageBucket && firebaseStorageBucket.trim() !== "") {
  minimalFirebaseConfig.storageBucket = firebaseStorageBucket;
}
if (firebaseMessagingSenderId && firebaseMessagingSenderId.trim() !== "") {
  minimalFirebaseConfig.messagingSenderId = firebaseMessagingSenderId;
}


console.log("firebase.ts: Firebase Config Object to be used for initialization:", JSON.stringify(minimalFirebaseConfig, (key, value) => key === "apiKey" ? "REDACTED_FOR_LOGS" : value, 2));

// Initialize Firebase
let app;
console.log("firebase.ts: Checking if Firebase apps are already initialized...");
if (!getApps().length) {
  console.log("firebase.ts: No Firebase apps initialized. Attempting to initializeApp...");
  try {
    app = initializeApp(minimalFirebaseConfig);
    console.log("firebase.ts: Firebase app initialized successfully.");
    if (app.options.authDomain) {
        console.log(`firebase.ts: Initialized Firebase App - authDomain from app.options: ${app.options.authDomain}, projectId: ${app.options.projectId}`);
    } else {
        console.warn("firebase.ts: Initialized Firebase App - authDomain from app.options is undefined/empty.");
    }
  } catch (error) {
    console.error("firebase.ts: ERROR during initializeApp(minimalFirebaseConfig):", error);
    console.error("firebase.ts: Firebase Config used at initialization attempt:", JSON.stringify(minimalFirebaseConfig, (key, value) => key === "apiKey" ? "REDACTED_FOR_LOGS" : value, 2));
    if (error instanceof Error && (error.message.toLowerCase().includes('api key') || error.message.toLowerCase().includes('project id') || error.message.toLowerCase().includes('auth domain') || error.message.toLowerCase().includes('app id'))) {
        console.error("\n\nSDK INITIALIZATION FAILED. THIS OFTEN MEANS ONE OF THE CRITICAL FIREBASE CONFIG VALUES (API KEY, PROJECT ID, AUTH DOMAIN, APP ID) IS INVALID OR MISSING. DOUBLE CHECK YOUR ENVIRONMENT VARIABLES AND FIREBASE CONSOLE SETTINGS.\n\n");
    }
    throw error;
  }
} else {
  console.log("firebase.ts: Existing Firebase app found. Retrieving with getApp().");
  app = getApp();
   if (app.options.authDomain) {
        console.log(`firebase.ts: Retrieved Firebase App - authDomain from app.options: ${app.options.authDomain}, projectId: ${app.options.projectId}`);
    } else {
        console.warn("firebase.ts: Retrieved Firebase App - authDomain from app.options is undefined/empty.");
    }
}

let db;
let authInst;

if (app) {
  console.log("firebase.ts: Attempting to get Firestore instance...");
  try {
    db = getFirestore(app);
    console.log("firebase.ts: Firestore instance obtained successfully.");
  } catch (error) {
    console.error("firebase.ts: ERROR obtaining Firestore instance:", error);
    throw error;
  }

  console.log("firebase.ts: Attempting to get Auth instance...");
  try {
    authInst = getAuth(app);
    console.log("firebase.ts: Firebase Auth instance obtained successfully.");
  } catch (error) {
    console.error("firebase.ts: ERROR obtaining Firebase Auth instance:", error);
    throw error;
  }
} else {
  const message = "firebase.ts: Firebase app is not available. Cannot get Firestore or Auth.";
  console.error(message);
  throw new Error(message);
}

console.log("firebase.ts: Script end, exporting app, db, auth.");
export { app, db, authInst as auth };
