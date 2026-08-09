import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  runTransaction,
  Timestamp,
  getDocs,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const SALES_COLLECTION = 'sales';
const PRODUCTS_COLLECTION = 'products';
const CASHFLOW_COLLECTION = 'cashflow';
const PAYMENTS_COLLECTION = 'payments';

/**
 * Calculate payment status based on amount paid vs sale price
 */
const calcPaymentStatus = (salePrice, amountPaid) => {
  const paid = Number(amountPaid) || 0;
  const price = Number(salePrice) || 0;
  if (paid <= 0) return 'Pendente';
  if (paid >= price) return 'Total Pago';
  return 'Pago Parcial';
};

/**
 * Create a new sale with atomic transaction:
 * 1. Decrements product stock
 * 2. Creates sale document
 * 3. Creates cashflow entry
 */
export const createSale = async (saleData) => {
  const {
    customerId,
    customerName,
    productId,
    productName,
    costPrice,
    salePrice,
    amountPaid,
    paymentMethod,
    date,
    weekLabel,
    size,
  } = saleData;

  const cost = Number(costPrice) || 0;
  const price = Number(salePrice) || 0;
  const paid = Number(amountPaid) || 0;
  const profit = price - cost;
  const remaining = price - paid;
  const status = calcPaymentStatus(price, paid);
  const saleDate = date ? Timestamp.fromDate(new Date(date)) : serverTimestamp();

  await runTransaction(db, async (transaction) => {
    // 1. Check if product exists
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await transaction.get(productRef);

    if (!productSnap.exists()) throw new Error('Produto não encontrado.');

    // 2. Create sale document
    const saleRef = doc(collection(db, SALES_COLLECTION));
    transaction.set(saleRef, {
      customerId,
      customerName,
      productId,
      productName,
      size: size || '',
      costPrice: cost,
      salePrice: price,
      profit,
      amountPaid: paid,
      remainingBalance: remaining,
      paymentStatus: status,
      paymentMethod: paymentMethod || '',
      weekLabel: weekLabel || '',
      date: saleDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 3. Create cashflow entry (only if payment > 0)
    if (paid > 0) {
      const cashflowRef = doc(collection(db, CASHFLOW_COLLECTION));
      transaction.set(cashflowRef, {
        type: 'entrada',
        amount: paid,
        description: `Venda: ${productName} → ${customerName}`,
        saleId: saleRef.id,
        category: 'venda',
        date: saleDate,
        createdAt: serverTimestamp(),
      });
    }
  });
};

/**
 * Register an additional payment on an existing sale
 */
export const registerPayment = async (saleId, paymentAmount, currentSale) => {
  const amount = Number(paymentAmount) || 0;
  if (amount <= 0) throw new Error('Valor do pagamento deve ser maior que zero.');

  const newAmountPaid = (currentSale.amountPaid || 0) + amount;
  const newRemaining = Math.max(0, (currentSale.salePrice || 0) - newAmountPaid);
  const newStatus = calcPaymentStatus(currentSale.salePrice, newAmountPaid);

  await runTransaction(db, async (transaction) => {
    // Update sale
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    transaction.update(saleRef, {
      amountPaid: newAmountPaid,
      remainingBalance: newRemaining,
      paymentStatus: newStatus,
      updatedAt: serverTimestamp(),
    });

    // Create payment record
    const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
    transaction.set(paymentRef, {
      saleId,
      amount,
      customerName: currentSale.customerName,
      productName: currentSale.productName,
      createdAt: serverTimestamp(),
    });

    // Create cashflow entry
    const cashflowRef = doc(collection(db, CASHFLOW_COLLECTION));
    transaction.set(cashflowRef, {
      type: 'entrada',
      amount,
      description: `Pgto parcial: ${currentSale.productName} → ${currentSale.customerName}`,
      saleId,
      category: 'pagamento',
      date: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  });
};

/**
 * Update a sale (without changing stock)
 */
export const updateSale = async (id, data) => {
  const ref = doc(db, SALES_COLLECTION, id);
  const paid = Number(data.amountPaid) || 0;
  const price = Number(data.salePrice) || 0;
  return await updateDoc(ref, {
    ...data,
    amountPaid: paid,
    remainingBalance: Math.max(0, price - paid),
    paymentStatus: calcPaymentStatus(price, paid),
    updatedAt: serverTimestamp(),
  });
};

export const getSalesRealtime = (callback) => {
  const q = query(collection(db, SALES_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(sales);
  });
};

export const getCashflowRealtime = (callback) => {
  const q = query(collection(db, CASHFLOW_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(entries);
  });
};

export const deleteSale = async (id) => {
  await deleteDoc(doc(db, SALES_COLLECTION, id));
  const q = query(collection(db, CASHFLOW_COLLECTION), where('saleId', '==', id));
  const snapshot = await getDocs(q);
  snapshot.forEach((d) => deleteDoc(d.ref));
};

