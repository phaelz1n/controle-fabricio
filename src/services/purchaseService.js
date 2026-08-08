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
  } = data;

  const qty = Number(quantity) || 0;
  const cost = Number(unitCost) || 0;
  const total = Number(totalCost) || qty * cost;
  const purchaseDate = date ? Timestamp.fromDate(new Date(date)) : serverTimestamp();

  await runTransaction(db, async (transaction) => {
    const productRef = doc(db, PRODUCTS_COL, productId);
    const productSnap = await transaction.get(productRef);
    if (!productSnap.exists()) throw new Error('Produto não encontrado.');

    const currentStock = productSnap.data().stock || 0;

    // Update stock (and optionally cost price)
    const productUpdate = { stock: currentStock + qty, updatedAt: serverTimestamp() };
    if (updateCostPrice && cost > 0) productUpdate.costPrice = cost;
    transaction.update(productRef, productUpdate);

    // Create purchase record
    const purchaseRef = doc(collection(db, PURCHASES_COL));
    transaction.set(purchaseRef, {
      productId,
      productName,
      quantity: qty,
      unitCost: cost,
      totalCost: total,
      supplier: supplier || '',
      notes: notes || '',
      date: purchaseDate,
      createdAt: serverTimestamp(),
    });

    // Create cashflow "saída"
    const cashflowRef = doc(collection(db, CASHFLOW_COL));
    transaction.set(cashflowRef, {
      type: 'saida',
      amount: total,
      description: `Compra: ${qty}x ${productName}`,
      purchaseId: purchaseRef.id,
      category: 'compra_estoque',
      date: purchaseDate,
      createdAt: serverTimestamp(),
    });
  });
};


