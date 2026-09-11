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

// --- App Check (opcional, desligado até existir uma chave) -------------------
//
// A API key do Firebase é pública por natureza em app client-side — ela
// identifica o projeto, não autentica ninguém. Quem impede um script
// qualquer de falar com o projeto é o App Check, não a chave.
//
// Este bloco fica INERTE enquanto `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` não
// existir, de propósito: ativar App Check pela metade (código no cliente sem
// registro no Console, ou enforcement ligado no Console sem chave aqui)
// derruba todas as chamadas ao Firestore. O passo a passo para ligar está em
// docs/seguranca.md.
const recaptchaSiteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;
if (recaptchaSiteKey) {
  import('firebase/app-check')
    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    })
    .catch((error) => {
      console.error('Não foi possível iniciar o App Check:', error);
    });
}
