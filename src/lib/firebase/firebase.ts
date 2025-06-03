
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

console.log("firebase.ts: SCRIPT EXECUTION STARTED. Next.js server is attempting to load this module.");

let app: FirebaseApp | undefined = undefined;
let db: Firestore | undefined = undefined;
let auth: Auth | undefined = undefined;

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const firebaseStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const firebaseMessagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const firebaseAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

const allowFirebaseInit = process.env.TEMP_ALLOW_FIREBASE_INIT === 'true';

console.log(`firebase.ts: TEMP_ALLOW_FIREBASE_INIT is set to: ${process.env.TEMP_ALLOW_FIREBASE_INIT}, so Firebase initialization will ${allowFirebaseInit ? 'BE ATTEMPTED' : 'BE SKIPPED'}.`);

if (allowFirebaseInit) {
  try {
    console.log("firebase.ts: Attempting Firebase initialization because TEMP_ALLOW_FIREBASE_INIT is true.");
    console.log(`firebase.ts: Env Var - NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${firebaseProjectId}`);
    console.log(`firebase.ts: Env Var - NEXT_PUBLIC_FIREBASE_API_KEY: ${firebaseApiKey ? 'Present' : 'MISSING!'}`);
    console.log(`firebase.ts: Env Var - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${firebaseAuthDomain}`);
    console.log(`firebase.ts: Env Var - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${firebaseStorageBucket}`);
    console.log(`firebase.ts: Env Var - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${firebaseMessagingSenderId}`);
    console.log(`firebase.ts: Env Var - NEXT_PUBLIC_FIREBASE_APP_ID: ${firebaseAppId}`);

    const CRITICAL_ERROR_PREFIX = "CRITICAL FIREBASE CONFIG ERROR (firebase.ts):";
    let hasCriticalError = false;

    if (!firebaseProjectId || firebaseProjectId === 'YOUR_PROJECT_ID_HERE' || firebaseProjectId.includes('YOUR_') || firebaseProjectId.length < 4) {
      console.error(`${CRITICAL_ERROR_PREFIX} Invalid or missing Firebase Project ID. NEXT_PUBLIC_FIREBASE_PROJECT_ID is currently: "${firebaseProjectId}". Firebase will NOT be initialized.`);
      hasCriticalError = true;
    }
    if (!firebaseApiKey || firebaseApiKey.includes('YOUR_') || firebaseApiKey.length < 10) {
      console.error(`${CRITICAL_ERROR_PREFIX} Invalid or missing Firebase API Key. NEXT_PUBLIC_FIREBASE_API_KEY is "REDACTED". Firebase will NOT be initialized.`);
      hasCriticalError = true;
    }
    if (!firebaseAuthDomain || firebaseAuthDomain.includes('YOUR_') || (!firebaseAuthDomain.includes('.firebaseapp.com') && !firebaseAuthDomain.includes('.web.app') && !firebaseAuthDomain.includes('localhost'))) {
      console.error(`${CRITICAL_ERROR_PREFIX} Invalid or missing Firebase Auth Domain. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is currently: "${firebaseAuthDomain}". Firebase will NOT be initialized.`);
      hasCriticalError = true;
    }
    if (!firebaseAppId || firebaseAppId.includes('YOUR_') || !firebaseAppId.startsWith('1:') || firebaseAppId.split(':').length < 3) {
      console.error(`${CRITICAL_ERROR_PREFIX} Invalid or missing Firebase App ID. NEXT_PUBLIC_FIREBASE_APP_ID is currently: "${firebaseAppId}". Firebase will NOT be initialized.`);
      hasCriticalError = true;
    }

    if (hasCriticalError) {
      console.error("firebase.ts: Due to critical configuration errors, Firebase initialization is HALTED.");
      // app, db, auth remain undefined
    } else {
      const minimalFirebaseConfig: FirebaseOptions = {
        apiKey: firebaseApiKey!,
        authDomain: firebaseAuthDomain!,
        projectId: firebaseProjectId!,
        appId: firebaseAppId!,
      };
      if (firebaseStorageBucket && firebaseStorageBucket.trim() !== "") {
        minimalFirebaseConfig.storageBucket = firebaseStorageBucket;
      }
      if (firebaseMessagingSenderId && firebaseMessagingSenderId.trim() !== "") {
        minimalFirebaseConfig.messagingSenderId = firebaseMessagingSenderId;
      }

      console.log("firebase.ts: Firebase Config Object to be used for initialization:", JSON.stringify(minimalFirebaseConfig, (key, value) => key === "apiKey" ? "REDACTED_FOR_LOGS" : value, 2));

      console.log("firebase.ts: Checking if Firebase apps are already initialized...");
      if (!getApps().length) {
        console.log("firebase.ts: No Firebase apps initialized. Attempting to initializeApp...");
        try {
          app = initializeApp(minimalFirebaseConfig);
          console.log("firebase.ts: Firebase app initialized successfully.");
        } catch (initError) {
          console.error("firebase.ts: ERROR during initializeApp(minimalFirebaseConfig):", initError);
          console.error("firebase.ts: Firebase Config used at initialization attempt:", JSON.stringify(minimalFirebaseConfig, (key, value) => key === "apiKey" ? "REDACTED_FOR_LOGS" : value, 2));
          app = undefined;
        }
      } else {
        console.log("firebase.ts: Existing Firebase app found. Retrieving with getApp().");
        app = getApp();
      }

      if (app) {
        if (app.options.authDomain) {
          console.log(`firebase.ts: Using Firebase App - authDomain from app.options: ${app.options.authDomain}, projectId: ${app.options.projectId}`);
        } else {
          console.warn("firebase.ts: Using Firebase App - authDomain from app.options is undefined/empty.");
        }

        console.log("firebase.ts: Attempting to get Firestore instance...");
        try {
          db = getFirestore(app);
          console.log("firebase.ts: Firestore instance obtained successfully.");
        } catch (firestoreError) {
          console.error("firebase.ts: ERROR obtaining Firestore instance:", firestoreError);
          db = undefined;
        }

        console.log("firebase.ts: Attempting to get Auth instance...");
        try {
          auth = getAuth(app);
          console.log("firebase.ts: Firebase Auth instance obtained successfully.");
        } catch (authError) {
          console.error("firebase.ts: ERROR obtaining Firebase Auth instance:", authError);
          auth = undefined;
        }
      } else {
        console.error("firebase.ts: Firebase app is not available (either not initialized or initialization failed). Firestore and Auth will not be initialized.");
      }
    }
  } catch (e) {
    console.error("firebase.ts: UNEXPECTED TOP-LEVEL ERROR during Firebase setup:", e);
    app = undefined;
    db = undefined;
    auth = undefined;
  }
} else {
  console.log("firebase.ts: SKIPPING Firebase initialization as TEMP_ALLOW_FIREBASE_INIT is not 'true'. `app`, `db`, and `auth` will be undefined.");
}

console.log(`firebase.ts: Script end. Exporting app: ${app ? 'DEFINED' : 'UNDEFINED'}, db: ${db ? 'DEFINED' : 'UNDEFINED'}, auth: ${auth ? 'DEFINED' : 'UNDEFINED'}.`);
export { app, db, auth };

