import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';

// Safely load local firebase-applet-config.json if present without throwing build errors on Vercel
const configFiles = import.meta.glob<{ default: Record<string, string> }>('/firebase-applet-config.json', { eager: true });
const defaultConfig = (configFiles['/firebase-applet-config.json'] as any)?.default || {};

// Allow deployment platforms like Vercel to override via environment variables,
// while defaulting to the project's firebase-applet-config.json if available.
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultConfig.projectId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultConfig.appId || '',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || defaultConfig.firestoreDatabaseId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId || '',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: true,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as mandated by Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      timeoutPromise,
    ]);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('offline') ||
        error.message.includes('timeout') ||
        error.message.includes('Backend didn\'t respond')
      ) {
        console.warn('Firebase client operating in offline/reconnecting mode.');
      }
    }
    return false;
  }
}

// Unique session ID per browser tab (persisted in sessionStorage)
export function getSessionId(): string {
  const STORAGE_KEY = 'banter_tab_session_id';
  try {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }
}

// Persistent user name across tabs (localStorage)
export function getSavedUserName(): string {
  try {
    return (localStorage.getItem('banter_user_name') || '').trim();
  } catch {
    return '';
  }
}

export function saveUserName(name: string): void {
  try {
    localStorage.setItem('banter_user_name', name.trim());
  } catch (e) {
    console.error('Failed to save name to localStorage', e);
  }
}

export function clearLocalData(): void {
  try {
    localStorage.removeItem('banter_user_name');
    sessionStorage.removeItem('banter_tab_session_id');
  } catch (e) {
    console.error('Failed to clear local data', e);
  }
}
