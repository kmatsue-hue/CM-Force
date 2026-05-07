// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
export default app;
