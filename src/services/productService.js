import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'products';

export const getProductsRealtime = (callback) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(products);
  });
};

export const addProduct = async (data) => {
  return await addDoc(collection(db, COLLECTION), {
    ...data,
    stock: Number(data.stock) || 0,
    costPrice: Number(data.costPrice) || 0,
    salePrice: Number(data.salePrice) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateProduct = async (id, data) => {
  const ref = doc(db, COLLECTION, id);
  return await updateDoc(ref, {
    ...data,
    stock: Number(data.stock) || 0,
    costPrice: Number(data.costPrice) || 0,
    salePrice: Number(data.salePrice) || 0,
    updatedAt: serverTimestamp(),
  });
};

export const deleteProduct = async (id) => {
  await deleteDoc(doc(db, COLLECTION, id));
};
