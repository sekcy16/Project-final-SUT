import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {

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
