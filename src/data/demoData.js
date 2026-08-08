// Dados de demonstração baseados no modelo real do Excel
export const initialDemoProducts = [
  { id: 'p1', name: 'Nike Air Force (Marrom)', category: 'Nike', costPrice: 110, salePrice: 219, stock: 3, createdAt: null },
  { id: 'p2', name: 'New Balance (Grafit)', category: 'New Balance', costPrice: 140, salePrice: 269, stock: 2, createdAt: null },
  { id: 'p3', name: 'New Balance (Prata)', category: 'New Balance', costPrice: 150, salePrice: 299, stock: 1, createdAt: null },
  { id: 'p4', name: 'Nike Dunk', category: 'Nike', costPrice: 110, salePrice: 209, stock: 0, createdAt: null },
  { id: 'p5', name: 'Adidas Superstar Plataforma', category: 'Adidas', costPrice: 120, salePrice: 239, stock: 4, createdAt: null },
  { id: 'p6', name: 'Sapatenis Tommy', category: 'Tommy', costPrice: 110, salePrice: 219, stock: 2, createdAt: null },
];

export const initialDemoCustomers = [
  { id: 'c1', name: 'Guilherme (Ht)', phone: '(85) 99999-1111', email: '', address: '', notes: 'Ht' },
  { id: 'c2', name: 'Jair Assis', phone: '(85) 99999-2222', email: '', address: '', notes: '' },
  { id: 'c3', name: 'Juliana (Ht)', phone: '(85) 99999-3333', email: '', address: '', notes: 'Ht' },
  { id: 'c4', name: 'Quelen (Ht)', phone: '(85) 99999-4444', email: '', address: '', notes: 'Ht' },
  { id: 'c5', name: 'Renato (Garagem Nordeste)', phone: '(85) 99999-5555', email: '', address: '', notes: 'Garagem Nordeste' },
  { id: 'c6', name: 'Rogerio Silva', phone: '(85) 99999-6666', email: '', address: '', notes: '' },
  { id: 'c7', name: 'Sabrina Fiuza', phone: '(85) 99999-7777', email: '', address: '', notes: '' },
  { id: 'c8', name: 'Silvia (vizinha casa 7)', phone: '(85) 99999-8888', email: '', address: '', notes: 'vizinha casa 7' },
];

export const initialDemoSales = [
  {
    id: 's1',
    date: '2026-08-07T00:00:00.000Z',
    customerName: 'Renato (Garagem Nordeste)',
    productName: 'Nike Air Force (Marrom)',
    costPrice: 110, salePrice: 219, profit: 109,
    amountPaid: 219, remainingBalance: 0,
    paymentStatus: 'Total Pago', paymentMethod: 'PIX',
    weekLabel: 'semana 03.08 a 07.08',
  },
  {
    id: 's2',
    date: '2026-08-07T00:00:00.000Z',
    customerName: 'Silvia (vizinha casa 7)',
    productName: 'New Balance (Grafit)',
    costPrice: 140, salePrice: 269, profit: 129,
    amountPaid: 140, remainingBalance: 129,
    paymentStatus: 'Pago Parcial', paymentMethod: 'Dinheiro',
    weekLabel: 'semana 03.08 a 07.08',
  },
  {
    id: 's3',
    date: '2026-08-06T00:00:00.000Z',
    customerName: 'Guilherme (Ht)',
    productName: 'New Balance (Grafit)',
    costPrice: 140, salePrice: 269, profit: 129,
    amountPaid: 0, remainingBalance: 269,
    paymentStatus: 'Pendente', paymentMethod: 'PIX',
    weekLabel: 'semana 03.08 a 07.08',
  },
  {
    id: 's4',
    date: '2026-08-05T00:00:00.000Z',
    customerName: 'Quelen (Ht)',
    productName: 'New Balance (Prata)',
    costPrice: 150, salePrice: 299, profit: 149,
    amountPaid: 299, remainingBalance: 0,
    paymentStatus: 'Total Pago', paymentMethod: 'PIX',
    weekLabel: 'semana 03.08 a 07.08',
  },
  {
    id: 's5',
    date: '2026-08-04T00:00:00.000Z',
    customerName: 'Sabrina Fiuza',
    productName: 'Adidas Superstar Plataforma',
    costPrice: 120, salePrice: 239, profit: 119,
    amountPaid: 100, remainingBalance: 139,
    paymentStatus: 'Pago Parcial', paymentMethod: 'Dinheiro',
    weekLabel: 'semana 03.08 a 07.08',
  },
  {
    id: 's6',
    date: '2026-08-03T00:00:00.000Z',
    customerName: 'Jair Assis',
    productName: 'Sapatenis Tommy',
    costPrice: 110, salePrice: 219, profit: 109,
    amountPaid: 219, remainingBalance: 0,
    paymentStatus: 'Total Pago', paymentMethod: 'Cartão',
    weekLabel: 'semana 03.08 a 07.08',
  },
  {
    id: 's7',
    date: '2026-07-31T00:00:00.000Z',
    customerName: 'Juliana (Ht)',
    productName: 'Nike Dunk',
    costPrice: 110, salePrice: 209, profit: 99,
    amountPaid: 209, remainingBalance: 0,
    paymentStatus: 'Total Pago', paymentMethod: 'PIX',
    weekLabel: 'semana 27.07 a 31.07',
  },
  {
    id: 's8',
    date: '2026-07-30T00:00:00.000Z',
    customerName: 'Rogerio Silva',
    productName: 'New Balance (Grafit)',
    costPrice: 140, salePrice: 269, profit: 129,
    amountPaid: 150, remainingBalance: 119,
    paymentStatus: 'Pago Parcial', paymentMethod: 'Dinheiro',
    weekLabel: 'semana 27.07 a 31.07',
  },
];

// ── Persistence Helpers ───────────────────────────────────────────────────

export const getDemoProducts = () => {
  try {
    const saved = localStorage.getItem('demo_products');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...initialDemoProducts];
};
export const saveDemoProducts = (data) => localStorage.setItem('demo_products', JSON.stringify(data));

export const getDemoCustomers = () => {
  try {
    const saved = localStorage.getItem('demo_customers');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...initialDemoCustomers];
};
export const saveDemoCustomers = (data) => localStorage.setItem('demo_customers', JSON.stringify(data));

export const getDemoSales = () => {
  try {
    const saved = localStorage.getItem('demo_sales');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...initialDemoSales];
};
export const saveDemoSales = (data) => localStorage.setItem('demo_sales', JSON.stringify(data));

