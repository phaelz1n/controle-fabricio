import { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Package,
  TrendingDown,
  CalendarDays,
  Store,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';
import { useAuth } from '../contexts/AuthContext';
import {
  getDemoPurchases,
  registerDemoPurchase,
  getPurchasesRealtime,
  registerPurchase,
} from '../services/purchaseService';
import { getProductsRealtime } from '../services/productService';
import { getDemoProducts } from '../data/demoData';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  productId: '',
  quantity: '',
  unitCost: '',
  supplier: '',
  notes: '',
  date: new Date().toISOString().split('T')[0],
  updateCostPrice: false,
};

const Purchases = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.isDemo) {
      setProducts(getDemoProducts());
      setPurchases(getDemoPurchases());
      setLoading(false);
      return;
    }
    const unsubProducts = getProductsRealtime((data) => { setProducts(data); setLoading(false); });
    const unsubPurchases = getPurchasesRealtime(setPurchases);
    return () => { unsubProducts(); unsubPurchases(); };
  }, [user]);

  const selectedProduct = products.find((p) => p.id === form.productId);
  const qty = Number(form.quantity) || 0;
  const unitCost = Number(form.unitCost) || 0;
  const totalCost = qty * unitCost;

  // Metrics
  const metrics = useMemo(() => {
    const totalInvested = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
    const totalUnits = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const currentStockCost = products.reduce((sum, p) => sum + (p.costPrice || 0) * (p.stock || 0), 0);
    return { totalInvested, totalUnits, currentStockCost };
  }, [purchases, products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId) { toast.error('Selecione um produto.'); return; }
    if (qty <= 0) { toast.error('Informe a quantidade.'); return; }
    if (unitCost <= 0) { toast.error('Informe o valor de custo.'); return; }

    setSubmitting(true);
    try {
      const productName = selectedProduct?.name || '';
      if (user?.isDemo) {
        const newPurchase = registerDemoPurchase(
          { ...form, productName, totalCost, updateCostPrice: form.updateCostPrice },
          setProducts
        );
        setPurchases((prev) => [newPurchase, ...prev]);
        toast.success(`${qty} par${qty !== 1 ? 'es' : ''} de "${productName}" adicionado${qty !== 1 ? 's' : ''} ao estoque!`);
      } else {
        await registerPurchase({ ...form, productName, totalCost });
        toast.success(`Compra registrada! Estoque atualizado.`);
      }
      setModalOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err.message || 'Erro ao registrar compra.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'date',
      label: 'Data',
      render: (row) => (
        <span className="text-slate-400 text-xs">{formatDate(row.date || row.createdAt)}</span>
      ),
    },
    {
      key: 'productName',
      label: 'Produto',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-200">{row.productName}</p>
          {row.supplier && <p className="text-xs text-slate-500">{row.supplier}</p>}
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Qtd',
      render: (row) => (
        <span className="px-2.5 py-1 bg-violet-500/10 text-violet-300 text-xs font-bold rounded-lg border border-violet-500/20">
          +{row.quantity} {row.quantity === 1 ? 'par' : 'pares'}
        </span>
      ),
    },
    {
      key: 'unitCost',
      label: 'Custo Unit.',
      render: (row) => <span className="text-slate-300">{formatCurrency(row.unitCost)}</span>,
    },
    {
      key: 'totalCost',
      label: 'Total Gasto',
      render: (row) => (
        <span className="text-rose-300 font-semibold">{formatCurrency(row.totalCost)}</span>
      ),
    },
    {
      key: 'notes',
      label: 'Obs.',
      render: (row) => <span className="text-slate-500 text-xs">{row.notes || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Compras de Estoque</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Registre compras para atualizar o estoque e o fluxo de caixa automaticamente
          </p>
        </div>
        <button id="btn-add-purchase" onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          Registrar Compra
        </button>
      </div>

      {/* KPI mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={18} className="text-rose-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Investido em Compras</p>
            <p className="text-xl font-bold text-slate-100">{formatCurrency(metrics.totalInvested)}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pares Comprados</p>
            <p className="text-xl font-bold text-slate-100">{metrics.totalUnits} pares</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Store size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custo do Estoque Atual</p>
            <p className="text-xl font-bold text-slate-100">{formatCurrency(metrics.currentStockCost)}</p>
          </div>
        </div>
      </div>

      {/* Estoque atual por produto */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Package size={15} className="text-violet-400" />
          Posição Atual do Estoque
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((p) => (
            <div
              key={p.id}
              className={`p-3 rounded-xl border transition-all ${
                p.stock === 0
                  ? 'bg-rose-500/5 border-rose-500/15'
                  : p.stock <= 2
                  ? 'bg-amber-500/5 border-amber-500/15'
                  : 'bg-slate-800/40 border-slate-700/40'
              }`}
            >
              <p className="text-xs font-medium text-slate-300 truncate">{p.name}</p>
              <p className="text-xs text-slate-500 mb-2">{p.category || '—'}</p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-bold ${
                    p.stock === 0 ? 'text-rose-400' : p.stock <= 2 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {p.stock} {p.stock === 1 ? 'par' : 'pares'}
                </span>
                <span className="text-xs text-slate-500">{formatCurrency(p.costPrice)}</span>
              </div>
              <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    p.stock === 0 ? 'bg-rose-500' : p.stock <= 2 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, (p.stock / 10) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <p className="col-span-full text-sm text-slate-500 text-center py-6">
              Nenhum produto cadastrado ainda
            </p>
          )}
        </div>
      </div>

      {/* Histórico de compras */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <CalendarDays size={15} className="text-violet-400" />
          Histórico de Compras
        </h3>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={purchases}
            searchPlaceholder="Buscar por produto ou fornecedor..."
            searchKeys={['productName', 'supplier', 'notes']}
            emptyMessage="Nenhuma compra registrada ainda. Clique em 'Registrar Compra' para começar."
            pageSize={8}
          />
        )}
      </div>

      {/* ── MODAL REGISTRAR COMPRA ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setForm(EMPTY_FORM); }}
        title="Registrar Nova Compra"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Produto */}
          <div>
            <label className="label">Produto *</label>
            <select
              className="input-field"
              value={form.productId}
              onChange={(e) => {
                const p = products.find((x) => x.id === e.target.value);
                setForm((f) => ({
                  ...f,
                  productId: e.target.value,
                  unitCost: p ? String(p.costPrice) : '',
                }));
              }}
              required
            >
              <option value="">Selecionar produto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (estoque: {p.stock} {p.stock === 1 ? 'par' : 'pares'})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Não encontrou o produto? Cadastre primeiro em{' '}
              <a href="/produtos" className="text-violet-400 underline">Produtos</a>.
            </p>
          </div>

          {/* Produto info preview */}
          {selectedProduct && (
            <div className="flex items-center gap-3 p-3 bg-violet-500/8 border border-violet-500/15 rounded-xl">
              <Package size={16} className="text-violet-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-200">{selectedProduct.name}</p>
                <p className="text-xs text-slate-400">
                  Estoque atual: <strong className="text-violet-300">{selectedProduct.stock} {selectedProduct.stock === 1 ? 'par' : 'pares'}</strong>
                  {' · '}Custo registrado: <strong>{formatCurrency(selectedProduct.costPrice)}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Quantidade + Custo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantidade Comprada *</label>
              <input
                type="number" min="1" step="1" className="input-field"
                placeholder="ex: 3"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Custo por Par (R$) *</label>
              <input
                type="number" min="0" step="0.01" className="input-field"
                placeholder="0,00"
                value={form.unitCost}
                onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Totals preview */}
          {qty > 0 && unitCost > 0 && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="text-center">
                <p className="text-xs text-slate-500">Pares</p>
                <p className="text-sm font-bold text-violet-300">+{qty}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Custo Unit.</p>
                <p className="text-sm font-bold text-slate-300">{formatCurrency(unitCost)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Total Gasto</p>
                <p className="text-sm font-bold text-rose-300">{formatCurrency(totalCost)}</p>
              </div>
            </div>
          )}

          {/* Update cost price option */}
          {selectedProduct && unitCost > 0 && unitCost !== selectedProduct.costPrice && (
            <label className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 cursor-pointer hover:border-violet-500/30 transition-all">
              <input
                type="checkbox"
                className="mt-0.5 accent-violet-500"
                checked={form.updateCostPrice}
                onChange={(e) => setForm((f) => ({ ...f, updateCostPrice: e.target.checked }))}
              />
              <div>
                <p className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <RefreshCw size={13} className="text-violet-400" />
                  Atualizar preço de custo do produto
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Alterar de <span className="text-slate-300">{formatCurrency(selectedProduct.costPrice)}</span> para{' '}
                  <span className="text-violet-300">{formatCurrency(unitCost)}</span>
                </p>
              </div>
            </label>
          )}

          {/* Data */}
          <div>
            <label className="label">Data da Compra</label>
            <input
              type="date" className="input-field"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>

          {/* Fornecedor / Obs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fornecedor</label>
              <input
                className="input-field" placeholder="ex: Atacado XYZ"
                value={form.supplier}
                onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Observação</label>
              <input
                className="input-field" placeholder="ex: compra de reposição"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          {/* Summary box */}
          {qty > 0 && selectedProduct && (
            <div className="p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl space-y-1 text-xs">
              <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle size={13} />O que vai acontecer:
              </p>
              <p className="text-slate-400">
                📦 Estoque de <strong className="text-slate-200">"{selectedProduct.name}"</strong>{' '}
                vai de <span className="text-slate-300">{selectedProduct.stock}</span> → <span className="text-emerald-300 font-bold">{selectedProduct.stock + qty} pares</span>
              </p>
              <p className="text-slate-400">
                💸 Caixa reduz em <span className="text-rose-300 font-bold">{formatCurrency(totalCost)}</span>
              </p>
              {form.updateCostPrice && (
                <p className="text-slate-400">
                  🔄 Custo do produto atualiza para <span className="text-violet-300 font-bold">{formatCurrency(unitCost)}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setModalOpen(false); setForm(EMPTY_FORM); }} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><ShoppingBag size={15} />Registrar Compra</>
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Purchases;
