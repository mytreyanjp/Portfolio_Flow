
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

console.log("firebase.ts: Module execution begins."); // Log entry into the module

let app: FirebaseApp | undefined = undefined;
let db: Firestore | undefined = undefined;
let auth: Auth | undefined = undefined;

let tempAllowFirebaseInitEnvVar: string | undefined;
try {
    tempAllowFirebaseInitEnvVar = process.env.TEMP_ALLOW_FIREBASE_INIT;
    // console.log(`firebase.ts: Raw value of process.env.TEMP_ALLOW_FIREBASE_INIT: "${tempAllowFirebaseInitEnvVar}" (type: ${typeof tempAllowFirebaseInitEnvVar})`);
} catch (e) {
    console.error("firebase.ts: CRITICAL ERROR attempting to read process.env.TEMP_ALLOW_FIREBASE_INIT:", e);
    tempAllowFirebaseInitEnvVar = undefined; // Assume false if reading the env var itself fails
}

const allowFirebaseInit = tempAllowFirebaseInitEnvVar === 'true';
console.log(`firebase.ts: Variable allowFirebaseInit is: ${allowFirebaseInit} (derived from TEMP_ALLOW_FIREBASE_INIT: "${tempAllowFirebaseInitEnvVar}")`);

if (allowFirebaseInit) {
  console.log("firebase.ts: ENTERING Firebase initialization block because allowFirebaseInit is true.");
  try {
    console.log("firebase.ts: Attempting to read NEXT_PUBLIC_FIREBASE_PROJECT_ID...");
    const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    console.log(`firebase.ts: NEXT_PUBLIC_FIREBASE_PROJECT_ID: "${firebaseProjectId}"`);

    console.log("firebase.ts: Attempting to read NEXT_PUBLIC_FIREBASE_API_KEY...");
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    // Do not log the API key value itself for security, just confirm if it's present-ish
    console.log(`firebase.ts: NEXT_PUBLIC_FIREBASE_API_KEY is ${firebaseApiKey ? 'present (not empty)' : 'MISSING or empty'}`);

    console.log("firebase.ts: Attempting to read NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN...");
    const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    console.log(`firebase.ts: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "${firebaseAuthDomain}"`);

    console.log("firebase.ts: Attempting to read NEXT_PUBLIC_FIREBASE_APP_ID...");
    const firebaseAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    console.log(`firebase.ts: NEXT_PUBLIC_FIREBASE_APP_ID: "${firebaseAppId}"`);

    console.log("firebase.ts: Attempting to read NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (optional)...");
    const firebaseStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    console.log(`firebase.ts: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "${firebaseStorageBucket}"`);
    
    console.log("firebase.ts: Attempting to read NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID (optional)...");
    const firebaseMessagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    console.log(`firebase.ts: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "${firebaseMessagingSenderId}"`);


    const CRITICAL_ERROR_PREFIX = "CRITICAL FIREBASE CONFIG ERROR (firebase.ts):";
    let hasCriticalError = false;

    if (!firebaseProjectId || firebaseProjectId === 'YOUR_PROJECT_ID_HERE' || firebaseProjectId.includes('YOUR_') || firebaseProjectId.length < 4) {
      console.error(`${CRITICAL_ERROR_PREFIX} Invalid or missing Firebase Project ID. NEXT_PUBLIC_FIREBASE_PROJECT_ID is currently: "${firebaseProjectId}". Firebase will NOT be initialized.`);
      hasCriticalError = true;
    }
    if (!firebaseApiKey || firebaseApiKey.includes('YOUR_') || firebaseApiKey.length < 10) {
      console.error(`${CRITICAL_ERROR_PREFIX} Invalid or missing Firebase API Key. Firebase will NOT be initialized.`);
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
      // app, db, auth will remain undefined
    } else {
      const minimalFirebaseConfig: FirebaseOptions = {
        apiKey: firebaseApiKey!, // Already checked for presence
        authDomain: firebaseAuthDomain!, // Already checked
        projectId: firebaseProjectId!, // Already checked
        appId: firebaseAppId!, // Already checked
      };
      if (firebaseStorageBucket && firebaseStorageBucket.trim() !== "" && !firebaseStorageBucket.includes("YOUR_")) {
        minimalFirebaseConfig.storageBucket = firebaseStorageBucket;
      }
      if (firebaseMessagingSenderId && firebaseMessagingSenderId.trim() !== "" && !firebaseMessagingSenderId.includes("YOUR_")) {
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
          app = undefined; // Explicitly set to undefined on error
        }
      } else {
        console.log("firebase.ts: Existing Firebase app found. Retrieving with getApp().");
        app = getApp();
         if (app.options.projectId !== minimalFirebaseConfig.projectId || app.options.appId !== minimalFirebaseConfig.appId) {
            console.warn("firebase.ts: WARNING - Existing Firebase app's config (ProjectID/AppID) does not match the current config. This might lead to issues if you expect a different app instance.");
            console.warn("firebase.ts: Existing App Project ID:", app.options.projectId, "Current Config Project ID:", minimalFirebaseConfig.projectId);
            console.warn("firebase.ts: Existing App App ID:", app.options.appId, "Current Config App ID:", minimalFirebaseConfig.appId);
        }
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
          db = undefined; // Explicitly set to undefined on error
        }

        console.log("firebase.ts: Attempting to get Auth instance...");
        try {
          auth = getAuth(app);
          console.log("firebase.ts: Firebase Auth instance obtained successfully.");
        } catch (authError) {
          console.error("firebase.ts: ERROR obtaining Firebase Auth instance:", authError);
          auth = undefined; // Explicitly set to undefined on error
        }
      } else {
        console.error("firebase.ts: Firebase app is not available (either not initialized or initialization failed). Firestore and Auth will not be initialized.");
      }
    }
  } catch (e) {
    console.error("firebase.ts: UNEXPECTED TOP-LEVEL ERROR during Firebase setup (within allowFirebaseInit block):", e);
    app = undefined; // Ensure these are undefined on any unexpected error
    db = undefined;
    auth = undefined;
  }
} else {
  console.log("firebase.ts: SKIPPING Firebase initialization as allowFirebaseInit is false.");
}

console.log(`firebase.ts: Module execution end. Exporting app: ${app ? 'DEFINED' : 'UNDEFINED'}, db: ${db ? 'DEFINED' : 'UNDEFINED'}, auth: ${auth ? 'DEFINED' : 'UNDEFINED'}.`);
export { app, db, auth };
