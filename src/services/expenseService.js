import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const EXPENSES_COL = 'expenses';

export const getExpensesRealtime = (callback) => {
  const q = query(collection(db, EXPENSES_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const registerExpense = async (data) => {
  const { amount, description, date } = data;
  await addDoc(collection(db, EXPENSES_COL), {
    amount: Number(amount) || 0,
    description: description || '',
    date: date || new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
};

export const deleteExpense = async (id) => {
  await deleteDoc(doc(db, EXPENSES_COL, id));
};
