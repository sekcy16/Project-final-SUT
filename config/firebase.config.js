import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDh68doOeuGJAOXE0RzDCaiKO-DOpp52Hk",
  authDomain: "finalprojectdb-1a1aa.firebaseapp.com",
  projectId: "finalprojectdb-1a1aa",
  storageBucket: "finalprojectdb-1a1aa.appspot.com",
  messagingSenderId: "424749228418",
  appId: "1:424749228418:web:01203dc0677dbc4330ef9b",
  measurementId: "G-6M1K204BGW"
};

let app, firebaseAuth, firebaseDB;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  
  firebaseAuth = auth;
  firebaseDB = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { app, firebaseAuth, firebaseDB };