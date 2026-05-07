// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkvFaSJCmzFOtnFugc8F1ya_6dypwgSdc",
  authDomain: "cm-force.firebaseapp.com",
  projectId: "cm-force",
  storageBucket: "cm-force.firebasestorage.app",
  messagingSenderId: "317724585035",
  appId: "1:317724585035:web:328ab28c0f8d2970fbb1ce"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
