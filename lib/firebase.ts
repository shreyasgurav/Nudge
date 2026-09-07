import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDc4Iv22YucecdBUkKDUdSZ2BE44jdMmuI",
  authDomain: "nudgeautomationapp.firebaseapp.com",
  projectId: "nudgeautomationapp",
  storageBucket: "nudgeautomationapp.firebasestorage.app",
  messagingSenderId: "707016749117",
  appId: "1:707016749117:web:578cd44db6273bebcbfa54",
  measurementId: "G-FCY031BM38"
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
