import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const SETTINGS_DOC = 'settings/financial';

export const getFinancialSettings = async () => {
  try {
    const ref = doc(db, 'settings', 'financial');
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
    return { capitalInicial: 0 };
  } catch {
    return { capitalInicial: 0 };
  }
};

export const saveFinancialSettings = async (data) => {
  const ref = doc(db, 'settings', 'financial');
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
};
