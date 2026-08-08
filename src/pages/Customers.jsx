import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Phone, Search, User } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import {
  getCustomersRealtime,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from '../services/customerService';
import { useAuth } from '../contexts/AuthContext';
import { getDemoCustomers, saveDemoCustomers } from '../data/demoData';
import { getInitials } from '../utils/formatters';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.isDemo) {
      setCustomers(getDemoCustomers());
      setLoading(false);
      return;
    }
    const unsub = getCustomersRealtime((data) => {
      setCustomers(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (customer) => {
    setSelected(customer);
    setForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setModalOpen(true);
  };

  const openDelete = (customer) => {
    setSelected(customer);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (user?.isDemo) {
        let newCustomers;
        if (selected) {
          newCustomers = getDemoCustomers().map((c) => (c.id === selected.id ? { ...c, ...form } : c));
          toast.success('Cliente atualizado! (demo)');
        } else {
          newCustomers = [{ id: `demo-${Date.now()}`, ...form }, ...getDemoCustomers()];
          toast.success('Cliente cadastrado! (demo)');
        }
        saveDemoCustomers(newCustomers);
        setCustomers(newCustomers);
        setModalOpen(false);
        return;
      }
      if (selected) {
        await updateCustomer(selected.id, form);
        toast.success('Cliente atualizado!');
      } else {
        await addCustomer(form);
        toast.success('Cliente cadastrado!');
      }
      setModalOpen(false);
    } catch {
      toast.error('Erro ao salvar cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      if (user?.isDemo) {
        const newCustomers = getDemoCustomers().filter((c) => c.id !== selected.id);
        saveDemoCustomers(newCustomers);
        setCustomers(newCustomers);
        toast.success('Cliente excluído! (demo)');
        setDeleteModalOpen(false);
        return;
      }
      await deleteCustomer(selected.id);
      toast.success('Cliente excluído!');
      setDeleteModalOpen(false);
    } catch {
      toast.error('Erro ao excluir cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Cliente',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400 flex-shrink-0">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-medium text-slate-200">{row.name}</p>
            {row.notes && <p className="text-xs text-slate-500 truncate max-w-[200px]">{row.notes}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Telefone',
      render: (row) =>
        row.phone ? (
          <a
            href={`tel:${row.phone}`}
            className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Phone size={13} />
            {row.phone}
          </a>
        ) : (
          <span className="text-slate-600">—</span>
        ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => <span className="text-slate-400">{row.email || '—'}</span>,
    },
    {
      key: 'address',
      label: 'Endereço',
      render: (row) => <span className="text-slate-400 text-xs">{row.address || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Clientes</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {customers.length} cliente{customers.length !== 1 ? 's' : ''} cadastrado{customers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button id="btn-add-customer" onClick={openCreate} className="btn-primary">
          <Plus size={16} />
          Novo Cliente
        </button>
      </div>

      {/* Quick info banner */}
      <div className="flex items-center gap-2 px-4 py-3 bg-violet-500/5 border border-violet-500/15 rounded-xl text-xs text-violet-300">
        <Search size={13} />
        <span>Use a busca abaixo para encontrar rapidamente um cliente pelo nome, telefone ou anotações durante o atendimento.</span>
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
            data={customers}
            searchPlaceholder="Buscar por nome, telefone, anotações..."
            searchKeys={['name', 'phone', 'email', 'notes', 'address']}
            emptyMessage="Nenhum cliente cadastrado ainda."
            actions={(row) => (
              <>
                <button
                  id={`btn-edit-customer-${row.id}`}
                  onClick={() => openEdit(row)}
                  className="p-2 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                  title="Editar"
                >
                  <Pencil size={15} />
                </button>
                <button
                  id={`btn-delete-customer-${row.id}`}
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
        title={selected ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome completo *</label>
            <input
              className="input-field"
              placeholder="ex: João Silva"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Telefone / WhatsApp</label>
              <input
                className="input-field"
                placeholder="(00) 90000-0000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="email@exemplo.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Endereço</label>
            <input
              className="input-field"
              placeholder="Rua, número, bairro..."
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Anotações (referência)</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="ex: vizinha casa 7, trabalha na loja X..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir Cliente"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Tem certeza que deseja excluir o cliente{' '}
            <strong className="text-slate-100">"{selected?.name}"</strong>?
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

export default Customers;
