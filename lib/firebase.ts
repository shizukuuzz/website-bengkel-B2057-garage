import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD_QDUIF091X2klgpq4nkeqj8IVC4WzPaI",
  authDomain: "b2057garage.firebaseapp.com",
  projectId: "b2057garage",
  storageBucket: "b2057garage.firebasestorage.app",
  messagingSenderId: "60598747175",
  appId: "1:60598747175:web:17b5f7b56c22ffb0db4e02",
  measurementId: "G-ETX50LD226",
};

// 🔥 initialize firebase app
export const app = initializeApp(firebaseConfig);

// ✅ auth pakai persistence (AsyncStorage)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
