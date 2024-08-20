// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAPTRnIZ3NZZDyGx9_2taquL7HjVwAX0M8",
  authDomain: "video-hash-1fb7d.firebaseapp.com",
  projectId: "video-hash-1fb7d",
  storageBucket: "video-hash-1fb7d.appspot.com",
  messagingSenderId: "589493241267",
  appId: "1:589493241267:web:3029de6630eae890a2b7c6",
  measurementId: "G-NWHFS0ZK4H",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
