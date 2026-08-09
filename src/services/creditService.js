import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const CREDITS_COL = 'supplier_credits';

export const getCreditsRealtime = (callback) => {
  const q = query(collection(db, CREDITS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const registerCredit = async (data) => {
  const { supplier, amount, date } = data;
  await addDoc(collection(db, CREDITS_COL), {
    supplier: supplier || '',
    amount: Number(amount) || 0,
    date: date || new Date().toISOString(),
    status: 'active', // 'active' or 'used'
    createdAt: serverTimestamp(),
  });
};

export const markCreditAsUsed = async (id, isUsed) => {
  await updateDoc(doc(db, CREDITS_COL, id), {
    status: isUsed ? 'used' : 'active',
  });
};

export const deleteCredit = async (id) => {
  await deleteDoc(doc(db, CREDITS_COL, id));
};
