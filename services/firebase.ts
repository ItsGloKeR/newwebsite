// services/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged,
  User,
  Auth
} from "firebase/auth";
import { getFirestore, Firestore, deleteField } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// User provided Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyA96JXaNZ5rps6FL6-4RjfpvjW8_JPLqI8",
  authDomain: "aniglok.firebaseapp.com",
  projectId: "aniglok",
  storageBucket: "aniglok.appspot.com",
  messagingSenderId: "38757628383",
  appId: "1:38757628383:web:c86411fb6ec839f7eaac6a",
  measurementId: "G-XYE4NDJBEC"
};

// Check if the config is valid and not using placeholders
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.projectId !== "YOUR_PROJECT_ID";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        // If init fails, ensure services are null
        app = null;
        auth = null;
        db = null;
        storage = null;
    }
} else {
    console.warn("Firebase is not configured. Please add your Firebase project configuration to services/firebase.ts. The app will run in offline/guest mode.");
}

export { auth, db, storage, onAuthStateChanged, isFirebaseConfigured, deleteField };
export type { User };