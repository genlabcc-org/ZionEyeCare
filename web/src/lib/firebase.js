// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBAzpLxhcTATW6iZK-0huNSpZ4-xPWXrNk",
  authDomain: "zion-eyecare.firebaseapp.com",
  projectId: "zion-eyecare",
  storageBucket: "zion-eyecare.firebasestorage.app",
  messagingSenderId: "798100114210",
  appId: "1:798100114210:web:f7056e1017685e85a9737b",
  measurementId: "G-J6L8VMCNNN"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const firebaseApp = app;

// Auth & Providers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}
