import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc,
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  getDocs 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { Prayer } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Define Operation types for strict security tracking as required in system instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

// Global variables for Firebase state
let useFirestore = false;
let db: any = null;
export let auth: any = null;

// Determine if real Firebase config is set up (not default placeholder)
const isConfigReal = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'placeholder-api-key' && 
  firebaseConfig.projectId !== 'placeholder-project-id';

if (isConfigReal) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    useFirestore = true;
    console.log('Firebase Firestore and Authentication successfully initialized.');
  } catch (err) {
    console.warn('Failed to initialize Firebase, falling back to LocalStorage:', err);
    useFirestore = false;
  }
} else {
  console.info('No active Firebase config detected. Running on high-performance local database fallback.');
}

// Mandated advanced Firestore error handler
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
    },
    operationType,
    path
  };
  console.error('Firestore Security / API Error:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Setup Simple Event Broker for Local DB to mock real-time snapshot listeners
type LocalDBListener = (prayers: Prayer[]) => void;
const localDBListeners = new Set<LocalDBListener>();

function notifyLocalChange() {
  const prayers = getLocalPrayers();
  localDBListeners.forEach(listener => listener(prayers));
}

// Local Storage Helper utilities
function getLocalPrayers(): Prayer[] {
  const data = localStorage.getItem('titipan_doa_prayers');
  if (!data) {
    // Seed original mock data to make it look active with prayers from Jamaah
    const seedData: Prayer[] = [
      {
        id: 'seed-1',
        senderName: 'Siti Aminah',
        prayerText: 'Semoga anak-anak kami menjadi anak yang sholeh & sholehah, dilancarkan rezekinya, dan dimudahkan dalam menghafal Al-Qur\'an. Mohon doanya dibacakan di depan Ka\'bah.',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'seed-2',
        senderName: 'Hamba Allah',
        prayerText: 'Ya Allah, sembuhkanlah ibunda kami yang sedang sakit keras di tanah air. Berikanlah beliau kesembuhan total dan kekuatan bersabar. Aamiin ya Rabbal Alamin.',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'seed-3',
        senderName: 'Umar Faruq',
        prayerText: 'Semoga kami sekeluarga segera diundang oleh Allah SWT untuk menjadi tamu-Nya di baitullah menunaikan ibadah Haji secepatnya dengan haji yang mabrur. Aamiin.',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
        updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      }
    ];
    localStorage.setItem('titipan_doa_prayers', JSON.stringify(seedData));
    return seedData;
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// ------------------- Unified Database Functions -------------------

/**
 * Subscribes to real-time prayer updates.
 * Automatically handles Firestore real-time listener or LocalStorage mock listeners.
 */
export function subscribePrayers(onUpdate: (prayers: Prayer[]) => void): () => void {
  if (useFirestore && db) {
    const q = query(collection(db, 'prayers'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prayers: Prayer[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        prayers.push({
          id: docSnap.id,
          senderName: raw.senderName || 'Hamba Allah',
          prayerText: raw.prayerText || '',
          isRead: !!raw.isRead,
          createdAt: raw.createdAt?.toDate ? raw.createdAt.toDate().toISOString() : raw.createdAt,
          updatedAt: raw.updatedAt?.toDate ? raw.updatedAt.toDate().toISOString() : raw.updatedAt,
        });
      });
      onUpdate(prayers);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'prayers');
    });
    
    return unsubscribe;
  } else {
    // LocalStorage Observer fallback
    onUpdate(getLocalPrayers());
    localDBListeners.add(onUpdate);
    return () => {
      localDBListeners.delete(onUpdate);
    };
  }
}

/**
 * Submits a new prayer to the active database.
 */
export async function submitPrayer(senderName: string, prayerText: string): Promise<string> {
  const name = senderName.trim() === '' ? 'Hamba Allah' : senderName.trim();
  
  if (useFirestore && db) {
    try {
      const tempId = 'prayer_' + Date.now();
      const prayerDoc = {
        senderName: name,
        prayerText: prayerText,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Use setDoc with generated secure ID, or standard addDoc
      const res = await addDoc(collection(db, 'prayers'), prayerDoc);
      return res.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'prayers');
      return '';
    }
  } else {
    // Local DB write
    const prayers = getLocalPrayers();
    const newPrayer: Prayer = {
      id: 'local_' + Math.random().toString(36).substr(2, 9),
      senderName: name,
      prayerText: prayerText,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    prayers.unshift(newPrayer);
    localStorage.setItem('titipan_doa_prayers', JSON.stringify(prayers));
    notifyLocalChange();
    return newPrayer.id;
  }
}

/**
 * Marks a prayer request as read or unread.
 */
export async function togglePrayerReadStatus(prayerId: string, isRead: boolean): Promise<void> {
  if (useFirestore && db) {
    try {
      const docRef = doc(db, 'prayers', prayerId);
      await updateDoc(docRef, {
        isRead: isRead,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prayers/${prayerId}`);
    }
  } else {
    // Local DB update
    const prayers = getLocalPrayers();
    const index = prayers.findIndex(p => p.id === prayerId);
    if (index !== -1) {
      prayers[index].isRead = isRead;
      prayers[index].updatedAt = new Date().toISOString();
      localStorage.setItem('titipan_doa_prayers', JSON.stringify(prayers));
      notifyLocalChange();
    }
  }
}

/**
 * Returns whether Firestore database is currently actively used.
 */
export function isUsingFirestore(): boolean {
  return useFirestore;
}

/**
 * Signs in the admin using a simple PIN.
 */
export async function signInAdmin(email: string, pin: string): Promise<any> {
  const finalPin = pin || email; // Fallback in case only one argument is supplied
  if (finalPin === '096333') {
    const mockUser = {
      uid: 'portal-admin-096333',
      email: 'admin@titipandoa.com',
      displayName: 'Pengelola Doa',
      emailVerified: true
    };
    localStorage.setItem('titipan_doa_local_admin', JSON.stringify(mockUser));
    window.dispatchEvent(new Event('storage'));
    return mockUser;
  } else {
    throw new Error('PIN salah. Silakan masukkan PIN yang benar.');
  }
}

/**
 * Signs out the admin.
 */
export async function signOutAdmin(): Promise<void> {
  localStorage.removeItem('titipan_doa_local_admin');
  window.dispatchEvent(new Event('storage'));
}

/**
 * Listens for administrative session auth state changes.
 */
export function onAdminStateChanged(callback: (user: any | null) => void): () => void {
  const getSavedUser = () => {
    const saved = localStorage.getItem('titipan_doa_local_admin');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  };

  callback(getSavedUser());
  
  const handler = () => {
    callback(getSavedUser());
  };
  
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('storage', handler);
  };
}
