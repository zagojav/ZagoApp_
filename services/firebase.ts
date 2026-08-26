import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth, type Persistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './firebaseConfig';

// getReactNativePersistence exists at runtime — Metro correctly resolves the
// SDK's "react-native"-conditioned build — but isn't declared in either
// `firebase/auth`'s or `@firebase/auth`'s public .d.ts: both list a generic
// `types` entry before their `react-native` branch in package.json `exports`,
// so TypeScript's declaration resolution never reaches it. Pull the value in
// via require() to sidestep type resolution for just this one symbol.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence =
  require('firebase/auth').getReactNativePersistence;

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // initializeAuth throws "auth/already-initialized" when this module is
  // re-evaluated by Fast Refresh — fall back to the existing instance.
  authInstance = getAuth(app);
}
export const auth: Auth = authInstance;

export const db: Firestore = getFirestore(app);
