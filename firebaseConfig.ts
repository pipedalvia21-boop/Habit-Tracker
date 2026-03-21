import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA9VqnoZtUsA8iTAxJS2s0xXE9df3gMSh8",
  authDomain: "habit-tracker-app-b0df6.firebaseapp.com",
  projectId: "habit-tracker-app-b0df6",
  storageBucket: "habit-tracker-app-b0df6.firebasestorage.app",
  messagingSenderId: "897168010792",
  appId: "1:897168010792:web:c842da583a71c737260f1d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
