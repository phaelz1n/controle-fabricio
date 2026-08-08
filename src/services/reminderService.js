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
const DEMO_KEY = 'demo_reminders';

// ── Demo mode helpers ──────────────────────────────────────────────────────
export const getDemoReminders = () => {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveDemoReminders = (list) => {
  localStorage.setItem(DEMO_KEY, JSON.stringify(list));
};

export const addDemoReminder = (data) => {
  const list = getDemoReminders();
  const newItem = { ...data, id: `rem-${Date.now()}`, done: false, createdAt: new Date().toISOString() };
  saveDemoReminders([newItem, ...list]);
  return newItem;
};

export const updateDemoReminder = (id, data) => {
  const list = getDemoReminders().map((r) => (r.id === id ? { ...r, ...data } : r));
  saveDemoReminders(list);
};

export const deleteDemoReminder = (id) => {
  saveDemoReminders(getDemoReminders().filter((r) => r.id !== id));
};

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
