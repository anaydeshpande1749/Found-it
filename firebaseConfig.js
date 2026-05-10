import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyA2RgPBzQppTfaBp24wHzg1l7SqaG8srGo",
  authDomain: "foundit-app-e2c3e.firebaseapp.com",
  projectId: "foundit-app-e2c3e",
  storageBucket: "foundit-app-e2c3e.firebasestorage.app",
  messagingSenderId: "699753043072",
  appId: "1:699753043072:web:b3db7f6538a26a32dd0265"
};

const app = initializeApp(firebaseConfig);

// Avoid using React Native persistence in Node.js/SSR mode (for API routes)
const authParams = (Platform.OS === 'web' || typeof window === 'undefined')
  ? {}
  : { persistence: getReactNativePersistence(ReactNativeAsyncStorage) };

export const auth = initializeAuth(app, authParams);
export const db = getFirestore(app);
export const storage = getStorage(app);