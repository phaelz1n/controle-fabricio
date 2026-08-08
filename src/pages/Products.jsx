import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import {
  getProductsRealtime,
  addProduct,
  updateProduct,
  deleteProduct,
} from '../services/productService';
import { useAuth } from '../contexts/AuthContext';

import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  category: '',
  costPrice: '',
  salePrice: '',
  stock: '',
};

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = getProductsRealtime((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setSelected(product);
    setForm({
      name: product.name || '',
      category: product.category || '',
      costPrice: String(product.costPrice || ''),
      salePrice: String(product.salePrice || ''),
      stock: String(product.stock ?? ''),
    });
    setModalOpen(true);
  };

  const openDelete = (product) => {
    setSelected(product);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selected) {
        await updateProduct(selected.id, form);
        toast.success('Produto atualizado!');
      } else {
        await addProduct(form);
        toast.success('Produto cadastrado!');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error('Erro ao salvar produto.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deleteProduct(selected.id);
      toast.success('Produto excluído!');
      setDeleteModalOpen(false);
    } catch {
      toast.error('Erro ao excluir produto.');
    } finally {
      setSubmitting(false);
    }
  };

  const profit = (Number(form.salePrice) || 0) - (Number(form.costPrice) || 0);

  const columns = [
    {
      key: 'name',
      label: 'Produto',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-200">{row.name}</p>
          <p className="text-xs text-slate-500">{row.category || '—'}</p>
        </div>
      ),
    },
    {
      key: 'costPrice',
      label: 'Custo',
      render: (row) => <span className="text-slate-400">{formatCurrency(row.costPrice)}</span>,
    },
    {
      key: 'salePrice',
      label: 'Venda',
      render: (row) => <span className="text-slate-200 font-medium">{formatCurrency(row.salePrice)}</span>,
    },
    {
      key: 'profit',
      label: 'Lucro',
      render: (row) => {
        const p = (row.salePrice || 0) - (row.costPrice || 0);
        return <span className="text-emerald-400 font-medium">{formatCurrency(p)}</span>;
      },
    },
    {
      key: 'stock',
      label: 'Estoque',
      render: (row) => (
        <span
          className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
            row.stock === 0
              ? 'bg-rose-500/15 text-rose-400'
              : row.stock <= 2
              ? 'bg-amber-500/15 text-amber-400'
              : 'bg-emerald-500/15 text-emerald-400'
          }`}
        >
          {row.stock} {row.stock === 1 ? 'par' : 'pares'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Produtos</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button id="btn-add-product" onClick={openCreate} className="btn-primary">
          <Plus size={16} />
          Novo Produto
        </button>
      </div>

      {/* Table */}
      <div className="glass-card p-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={products}
            searchPlaceholder="Buscar produto..."
            searchKeys={['name', 'category']}
            emptyMessage="Nenhum produto cadastrado ainda."
            actions={(row) => (
              <>
                <button
                  id={`btn-edit-product-${row.id}`}
                  onClick={() => openEdit(row)}
                  className="p-2 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                  title="Editar"
                >
                  <Pencil size={15} />
                </button>
                <button
                  id={`btn-delete-product-${row.id}`}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar Produto' : 'Novo Produto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome do Produto *</label>
            <input
              className="input-field"
              placeholder="ex: Nike Air Force (Marrom)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Categoria / Marca</label>
            <input
              className="input-field"
              placeholder="ex: Nike, Adidas, New Balance..."
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor de Custo (R$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                placeholder="0,00"
                value={form.costPrice}
                onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Valor de Venda (R$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                placeholder="0,00"
                value={form.salePrice}
                onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Profit preview */}
          {form.costPrice && form.salePrice && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Package size={14} className="text-emerald-400" />
              <span className="text-xs text-emerald-400">
                Lucro por venda: <strong>{formatCurrency(profit)}</strong>
              </span>
            </div>
          )}

          <div>
            <label className="label">Quantidade em Estoque *</label>
            <input
              type="number"
              min="0"
              step="1"
              className="input-field"
              placeholder="0"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : selected ? (
                'Salvar'
              ) : (
                'Cadastrar'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir Produto"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Tem certeza que deseja excluir o produto{' '}
            <strong className="text-slate-100">"{selected?.name}"</strong>?
            <br />
            <span className="text-rose-400 text-xs mt-1 block">
              Esta ação não pode ser desfeita.
            </span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="btn-danger flex-1"
            >
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

export default Products;
