import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  runTransaction,
  doc,
  Timestamp,
  deleteDoc,
  updateDoc,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const PURCHASES_COL = 'purchases';
const PRODUCTS_COL = 'products';
const CASHFLOW_COL = 'cashflow';

// ── Firestore ──────────────────────────────────────────────────────────────
export const getPurchasesRealtime = (callback) => {
  const q = query(collection(db, PURCHASES_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

/**
 * Register a purchase with atomic transaction:
 * 1. Increment product stock by quantity
 * 2. Optionally update product cost price
 * 3. Create purchase record
 * 4. Create cashflow "saída" entry
 */
export const registerPurchase = async (data) => {
  const {
    productId,
    productName,
    quantity,
    unitCost,
    totalCost,
    supplier,
    notes,
    date,
    updateCostPrice,
    size,
    items, // [{ quantity, size }]
  } = data;

  const cost = Number(unitCost) || 0;
  
  // If items array is provided, use it, otherwise fallback to single quantity/size
  const purchaseItems = items && items.length > 0 
    ? items.map(item => ({ qty: Number(item.quantity) || 0, size: item.size || '' }))
    : [{ qty: Number(quantity) || 0, size: size || '' }];
    
  const totalQty = purchaseItems.reduce((acc, item) => acc + item.qty, 0);
  const total = Number(totalCost) || totalQty * cost;
  const purchaseDate = date ? Timestamp.fromDate(new Date(date)) : serverTimestamp();

  await runTransaction(db, async (transaction) => {
    const productRef = doc(db, PRODUCTS_COL, productId);
    const productSnap = await transaction.get(productRef);
    if (!productSnap.exists()) throw new Error('Produto não encontrado.');

    // Update optionally cost price
    const productUpdate = { updatedAt: serverTimestamp() };
    if (updateCostPrice && cost > 0) productUpdate.costPrice = cost;
    transaction.update(productRef, productUpdate);

    // Create purchase records for each item
    const purchaseIds = [];
    purchaseItems.forEach((item) => {
      if (item.qty <= 0) return;
      const purchaseRef = doc(collection(db, PURCHASES_COL));
      purchaseIds.push(purchaseRef.id);
      transaction.set(purchaseRef, {
        productId,
        productName,
        quantity: item.qty,
        size: item.size,
        unitCost: cost,
        totalCost: item.qty * cost,
        supplier: supplier || '',
        notes: notes || '',
        date: purchaseDate,
        createdAt: serverTimestamp(),
      });
    });

    if (purchaseIds.length === 0) throw new Error('Nenhuma quantidade informada.');

    // Create cashflow "saída"
    const cashflowRef = doc(collection(db, CASHFLOW_COL));
    transaction.set(cashflowRef, {
      type: 'saida',
      amount: total,
      description: `Compra: ${totalQty}x ${productName}`,
      purchaseId: purchaseIds[0], // link to first one, or maybe join them
      purchaseIds: purchaseIds, // store array of ids just in case
      category: 'compra_estoque',
      date: purchaseDate,
      createdAt: serverTimestamp(),
    });
  });
};

export const updatePurchase = async (id, data) => {
  const ref = doc(db, PURCHASES_COL, id);
  const qty = Number(data.quantity) || 0;
  const unitCost = Number(data.unitCost) || 0;
  return await updateDoc(ref, {
    ...data,
    quantity: qty,
    unitCost: unitCost,
    totalCost: qty * unitCost,
  });
};

export const deletePurchase = async (id) => {
  await deleteDoc(doc(db, PURCHASES_COL, id));
  const q = query(collection(db, CASHFLOW_COL), where('purchaseId', '==', id));
  const snapshot = await getDocs(q);
  snapshot.forEach((d) => deleteDoc(d.ref));
};
