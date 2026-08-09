import { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Package,
  TrendingDown,
  CalendarDays,
  Store,
  RefreshCw,
  RefreshCw,
  CheckCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';
import { useAuth } from '../contexts/AuthContext';
import {
  getPurchasesRealtime,
  getPurchasesRealtime,
  registerPurchase,
  updatePurchase,
  deletePurchase,
} from '../services/purchaseService';
import { getProductsRealtime } from '../services/productService';

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
  size: '',
};

const Purchases = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {

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
    return { totalInvested, totalUnits };
  }, [purchases]);

  const openEdit = (purchase) => {
    setSelectedPurchase(purchase);
    let dateStr = '';
    if (purchase.date) {
      const d = purchase.date.toDate ? purchase.date.toDate() : new Date(purchase.date);
      dateStr = d.toISOString().split('T')[0];
    }
    setForm({
      productId: purchase.productId || '',
      quantity: String(purchase.quantity || ''),
      unitCost: String(purchase.unitCost || ''),
      supplier: purchase.supplier || '',
      notes: purchase.notes || '',
      date: dateStr,
      updateCostPrice: false,
      size: purchase.size || '',
    });
    setModalOpen(true);
  };

  const openDelete = (purchase) => {
    setSelectedPurchase(purchase);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deletePurchase(selectedPurchase.id);
      toast.success('Compra excluída!');
      setDeleteModalOpen(false);
    } catch {
      toast.error('Erro ao excluir compra.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId) { toast.error('Selecione um produto.'); return; }
    if (qty <= 0) { toast.error('Informe a quantidade.'); return; }
    if (unitCost <= 0) { toast.error('Informe o valor de custo.'); return; }

    setSubmitting(true);
    try {
      const productName = selectedProduct?.name || '';

      if (selectedPurchase) {
        await updatePurchase(selectedPurchase.id, { ...form, productName, totalCost });
        toast.success('Compra atualizada!');
      } else {
        await registerPurchase({ ...form, productName, totalCost });
        toast.success(`Compra registrada! Estoque atualizado.`);
      }
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setSelectedPurchase(null);
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
      label: 'Qtd / Tam',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-violet-500/10 text-violet-300 text-xs font-bold rounded-lg border border-violet-500/20">
            +{row.quantity} {row.quantity === 1 ? 'par' : 'pares'}
          </span>
          {row.size && <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-lg border border-slate-700">Tam: {row.size}</span>}
        </div>
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
        <button id="btn-add-purchase" onClick={() => { setSelectedPurchase(null); setForm(EMPTY_FORM); setModalOpen(true); }} className="btn-primary">
          <Plus size={16} />
          Registrar Compra
        </button>
      </div>

      {/* KPI mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            actions={(row) => (
              <>
                <button
                  onClick={() => openEdit(row)}
                  className="p-2 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                  title="Editar"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => openDelete(row)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Excluir"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          />
        )}
      </div>

      {/* ── MODAL REGISTRAR COMPRA ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setForm(EMPTY_FORM); setSelectedPurchase(null); }}
        title={selectedPurchase ? 'Editar Compra' : 'Registrar Nova Compra'}
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
                  {p.name}
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
                  Custo registrado: <strong>{formatCurrency(selectedProduct.costPrice)}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Quantidade, Tamanho + Custo */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Qtd *</label>
              <input
                type="number" min="1" step="1" className="input-field"
                placeholder="ex: 1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Tamanho / Num.</label>
              <input
                className="input-field"
                placeholder="ex: 38"
                value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Custo / Par *</label>
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
            <button type="button" onClick={() => { setModalOpen(false); setForm(EMPTY_FORM); setSelectedPurchase(null); }} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : selectedPurchase ? 'Salvar' : <><ShoppingBag size={15} />Registrar Compra</>
              }
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL EXCLUIR COMPRA ── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir Compra"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Tem certeza que deseja excluir esta compra de{' '}
            <strong className="text-slate-100">"{selectedPurchase?.productName}"</strong>?
            <br />
            <span className="text-rose-400 text-xs mt-1 block">
              Esta ação não pode ser desfeita.
            </span>
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModalOpen(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button onClick={handleDelete} disabled={submitting} className="btn-danger flex-1">
              {submitting ? (
                <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
              ) : (
                'Excluir'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Purchases;
