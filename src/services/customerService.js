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

const COLLECTION = 'customers';

export const getCustomersRealtime = (callback) => {
  const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const customers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(customers);
  });
};

export const addCustomer = async (data) => {
  return await addDoc(collection(db, COLLECTION), {
    name: data.name?.trim() || '',
    phone: data.phone?.trim() || '',
    email: data.email?.trim() || '',
    address: data.address?.trim() || '',
    notes: data.notes?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateCustomer = async (id, data) => {
  const ref = doc(db, COLLECTION, id);
  return await updateDoc(ref, {
    name: data.name?.trim() || '',
    phone: data.phone?.trim() || '',
    email: data.email?.trim() || '',
    address: data.address?.trim() || '',
    notes: data.notes?.trim() || '',
    updatedAt: serverTimestamp(),
  });
};

export const deleteCustomer = async (id) => {
  await deleteDoc(doc(db, COLLECTION, id));
};
