import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// iOS Safari/WebKit's Intelligent Tracking Prevention can silently block or
// hang indexedDB access (private browsing, restrictive storage settings),
// which is what getAuth()'s default persistence relies on — the anonymous
// sign-in promise then never settles, hanging the app on the loading screen
// forever. Giving initializeAuth a persistence chain makes it fall through
// to localStorage, and finally to an in-memory session (doesn't survive a
// reload, but never hangs), instead of getting stuck on the first option.
let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
  });
} catch {
  // initializeAuth throws "auth/already-initialized" when this module is
  // re-evaluated (Fast Refresh / HMR) — fall back to the existing instance.
  authInstance = getAuth(app);
}
export const auth: Auth = authInstance;

export const db: Firestore = getFirestore(app);
