import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'reminders';


// ── Firestore ──────────────────────────────────────────────────────────────
export const getRemindersRealtime = (callback) => {
  const q = query(collection(db, COLLECTION), orderBy('dueDate', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const addReminder = async (data) => {
  return await addDoc(collection(db, COLLECTION), {
    ...data,
    done: false,
    createdAt: serverTimestamp(),
  });
};

export const toggleReminderDone = async (id, done) => {
  await updateDoc(doc(db, COLLECTION, id), { done: !done });
};

export const deleteReminder = async (id) => {
  await deleteDoc(doc(db, COLLECTION, id));
};
