import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA96JXaNZ5rps6FL6-4RjfpvjW8_JPLqI8",
  authDomain: "aniglok.firebaseapp.com",
  projectId: "aniglok",
  storageBucket: "aniglok.appspot.com",
  messagingSenderId: "38757628383",
  appId: "1:38757628383:web:c86411fb6ec839f7eaac6a",
  measurementId: "G-XYE4NDJBEC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
