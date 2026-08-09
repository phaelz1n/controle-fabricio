import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Bell,
  BellPlus,
  CheckCircle2,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import SearchableSelect from '../components/ui/SearchableSelect';
import { useAuth } from '../contexts/AuthContext';

import {
  getSalesRealtime,
  createSale,
  registerPayment,
  updateSale,
  deleteSale,
} from '../services/salesService';
import { getProductsRealtime } from '../services/productService';
import { getCustomersRealtime } from '../services/customerService';
import {
  getRemindersRealtime,
  addReminder,
  toggleReminderDone,
  deleteReminder,
} from '../services/reminderService';
import { formatCurrency, formatDate, getCurrentWeekLabel } from '../utils/formatters';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'PIX', icon: Smartphone },
  { value: 'Dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'Cartão', label: 'Cartão', icon: CreditCard },
];

const STATUS_FILTERS = ['Todos', 'Pendente', 'Pago Parcial', 'Total Pago'];

const Sales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newSaleModal, setNewSaleModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [reminderModal, setReminderModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedSaleForEdit, setSelectedSaleForEdit] = useState(null);

  const [form, setForm] = useState({
    customerId: '', amountPaid: '',
    paymentMethod: 'PIX',
    date: new Date().toISOString().split('T')[0],
    weekLabel: getCurrentWeekLabel(),
    items: [{ id: 'init', productId: '', size: '', customPrice: '', costPrice: 0, name: '' }],
  });

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { id: Date.now().toString(), productId: '', size: '', customPrice: '', costPrice: 0, name: '' }] }));
  };
  
  const updateItem = (id, field, value) => {
    setForm(f => ({ ...f, items: f.items.map(i => i.id === id ? { ...i, [field]: value } : i) }));
  };
  
  const removeItem = (id) => {
    setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));
  };

  const handleProductChange = (id, pId) => {
    const prod = products.find(p => p.id === pId);
    setForm(f => ({
      ...f,
      items: f.items.map(i => i.id === id ? {
        ...i, 
        productId: pId, 
        customPrice: prod ? String(prod.salePrice) : '',
        costPrice: prod ? prod.costPrice : 0,
        name: prod ? prod.name : ''
      } : i)
    }));
  };

  const [paymentAmount, setPaymentAmount] = useState('');
  const [reminderForm, setReminderForm] = useState({ dueDate: '', note: '', amountToCollect: '' });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Todos');



  useEffect(() => {

    const unsubSales = getSalesRealtime((data) => { setSales(data); setLoading(false); });
    const unsubProducts = getProductsRealtime(setProducts);
    const unsubCustomers = getCustomersRealtime(setCustomers);
    const unsubReminders = getRemindersRealtime(setReminders);
    return () => { unsubSales(); unsubProducts(); unsubCustomers(); unsubReminders(); };
  }, [user]);

  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  const amountPaid = Number(form.amountPaid) || 0;
  
  const totalCost = form.items.reduce((sum, item) => sum + (Number(item.costPrice) || 0), 0);
  const totalSale = form.items.reduce((sum, item) => sum + (item.customPrice !== '' ? Number(item.customPrice) : 0), 0);
  
  const remaining = Math.max(0, totalSale - amountPaid);
  const profit = totalSale - totalCost;
  const payStatus = amountPaid <= 0 ? 'Pendente' : amountPaid >= totalSale ? 'Total Pago' : 'Pago Parcial';

  const filteredSales = useMemo(() => {
    if (statusFilter === 'Todos') return sales;
    return sales.filter((s) => s.paymentStatus === statusFilter);
  }, [sales, statusFilter]);

  // Map saleId → reminders
  const remindersBySale = useMemo(() => {
    const map = {};
    reminders.forEach((r) => {
      if (!map[r.saleId]) map[r.saleId] = [];
      map[r.saleId].push(r);
    });
    return map;
  }, [reminders]);

  const openReminderModal = (sale) => {
    setSelectedSale(sale);
    setReminderForm({
      dueDate: '',
      note: '',
      amountToCollect: String(sale.remainingBalance || ''),
    });
    setReminderModal(true);
  };

  const openEdit = (sale) => {
    setSelectedSaleForEdit(sale);
    let dateStr = '';
    if (sale.date) {
      const d = sale.date.toDate ? sale.date.toDate() : new Date(sale.date);
      dateStr = d.toISOString().split('T')[0];
    }
    let items = sale.items || [];
    if (items.length === 0 && sale.productId) {
      items = [{
        id: '1',
        productId: sale.productId,
        name: sale.productName || '',
        size: sale.size || '',
        customPrice: String(sale.salePrice || ''),
        costPrice: sale.costPrice || 0,
      }];
    }
    if (items.length === 0) {
      items = [{ id: 'init', productId: '', size: '', customPrice: '', costPrice: 0, name: '' }];
    }

    setForm({
      customerId: sale.customerId || '',
      amountPaid: String(sale.amountPaid || ''),
      paymentMethod: sale.paymentMethod || 'PIX',
      date: dateStr,
      weekLabel: sale.weekLabel || '',
      items,
    });
    setNewSaleModal(true);
  };

  const openDelete = (sale) => {
    setSelectedSaleForEdit(sale);
    setDeleteModalOpen(true);
  };

  const handleDeleteSale = async () => {
    setSubmitting(true);
    try {
      await deleteSale(selectedSaleForEdit.id);
      toast.success('Venda excluída!');
      setDeleteModalOpen(false);
    } catch {
      toast.error('Erro ao excluir venda.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewSale = async (e) => {
    e.preventDefault();
    if (!form.customerId) { toast.error('Selecione um cliente.'); return; }
    
    const validItems = form.items.filter(i => i.productId);
    if (validItems.length === 0) { toast.error('Adicione pelo menos um produto.'); return; }

    setSubmitting(true);
    try {
      const firstItemName = validItems[0].name;
      const productNameDisplay = validItems.length > 1 
        ? `${firstItemName} + ${validItems.length - 1} item(s)`
        : firstItemName;

      const data = {
        customerId: form.customerId, 
        customerName: selectedCustomer?.name || '',
        productId: validItems.length === 1 ? validItems[0].productId : 'multiple', 
        productName: productNameDisplay,
        size: validItems.length === 1 ? validItems[0].size : '',
        costPrice: totalCost, 
        salePrice: totalSale,
        items: validItems.map(i => ({
          productId: i.productId,
          productName: i.name,
          size: i.size,
          costPrice: i.costPrice,
          salePrice: Number(i.customPrice) || 0,
          profit: (Number(i.customPrice) || 0) - i.costPrice
        })),
        amountPaid: form.amountPaid, paymentMethod: form.paymentMethod,
        date: form.date, weekLabel: form.weekLabel,
      };

      if (selectedSaleForEdit) {
        await updateSale(selectedSaleForEdit.id, data);
        toast.success('Venda atualizada!');
      } else {
        await createSale(data);
        toast.success('Venda registrada com sucesso!');
      }
      setNewSaleModal(false);
      setForm({ customerId: '', amountPaid: '', paymentMethod: 'PIX', date: new Date().toISOString().split('T')[0], weekLabel: getCurrentWeekLabel(), items: [{ id: 'init', productId: '', size: '', customPrice: '', costPrice: 0, name: '' }] });
      setSelectedSaleForEdit(null);
    } catch (err) {
      toast.error(err.message || 'Erro ao registrar venda.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {

      await registerPayment(selectedSale.id, paymentAmount, selectedSale);
      toast.success('Pagamento registrado!');
      setPaymentModal(false); setPaymentAmount('');
    } catch (err) {
      toast.error(err.message || 'Erro ao registrar pagamento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = {
      saleId: selectedSale.id,
      customerId: selectedSale.customerId || '',
      customerName: selectedSale.customerName,
      productName: selectedSale.productName,
      dueDate: reminderForm.dueDate,
      note: reminderForm.note,
      amountToCollect: Number(reminderForm.amountToCollect) || 0,
    };
    try {
      await addReminder(data);
      toast.success('Lembrete criado!');
      setReminderModal(false);
    } catch {
      toast.error('Erro ao criar lembrete.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleReminder = (rem) => {
    toggleReminderDone(rem.id, rem.done);
  };

  const handleDeleteReminder = (id) => {
    deleteReminder(id);
    toast.success('Lembrete removido!');
  };

  const columns = [
    { key: 'date', label: 'Data', render: (row) => <span className="text-slate-400 text-xs">{formatDate(row.date || row.createdAt)}</span> },
    { key: 'customerName', label: 'Cliente', render: (row) => <span className="font-medium text-slate-200">{row.customerName}</span> },
    { key: 'productName', label: 'Produto', render: (row) => (
      <div>
        <span className="text-slate-400 block">{row.productName}</span>
        {row.size && <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-lg border border-slate-700 inline-block mt-0.5">Tam: {row.size}</span>}
      </div>
    )},
    { key: 'salePrice', label: 'Valor', render: (row) => <span className="text-slate-200">{formatCurrency(row.salePrice)}</span> },
    { key: 'amountPaid', label: 'Pago', render: (row) => <span className="text-emerald-400 font-medium">{formatCurrency(row.amountPaid)}</span> },
    { key: 'remainingBalance', label: 'Restante', render: (row) => <span className={row.remainingBalance > 0 ? 'text-amber-400' : 'text-slate-500'}>{formatCurrency(row.remainingBalance)}</span> },
    { key: 'paymentStatus', label: 'Status', render: (row) => <StatusBadge status={row.paymentStatus} /> },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Vendas</h2>
          <p className="text-sm text-slate-400 mt-0.5">{sales.length} venda{sales.length !== 1 ? 's' : ''} registrada{sales.length !== 1 ? 's' : ''}</p>
        </div>
        <button id="btn-add-sale" onClick={() => { setSelectedSaleForEdit(null); setForm({ customerId: '', amountPaid: '', paymentMethod: 'PIX', date: new Date().toISOString().split('T')[0], weekLabel: getCurrentWeekLabel(), items: [{ id: 'init', productId: '', size: '', customPrice: '', costPrice: 0, name: '' }] }); setNewSaleModal(true); }} className="btn-primary">
          <Plus size={16} />Nova Venda
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card p-5">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredSales}
            searchPlaceholder="Buscar por cliente ou produto..."
            searchKeys={['customerName', 'productName', 'paymentStatus', 'weekLabel']}
            emptyMessage="Nenhuma venda encontrada."
            actions={(row) => (
              <div className="flex items-center gap-1.5">
                {/* Reminder button — always visible for non-paid */}
                {row.paymentStatus !== 'Total Pago' && (
                  <div className="relative">
                    <button
                      id={`btn-reminder-${row.id}`}
                      onClick={() => openReminderModal(row)}
                      title="Adicionar lembrete de cobrança"
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        (remindersBySale[row.id]?.length || 0) > 0
                          ? 'bg-violet-500/15 text-violet-300 border-violet-500/25'
                          : 'bg-slate-800/60 text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 border-slate-700 hover:border-violet-500/25'
                      }`}
                    >
                      <BellPlus size={13} />
                      {(remindersBySale[row.id]?.length || 0) > 0 && (
                        <span className="w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] flex items-center justify-center font-bold">
                          {remindersBySale[row.id].length}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Receive payment */}
                {row.paymentStatus !== 'Total Pago' ? (
                  <button
                    id={`btn-payment-${row.id}`}
                    onClick={() => { setSelectedSale(row); setPaymentModal(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                  >
                    <DollarSign size={12} />Receber
                  </button>
                ) : (
                  <span className="text-xs text-slate-600 px-3">Quitado</span>
                )}

                <button
                  onClick={() => openEdit(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all ml-1"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => openDelete(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          />
        )}
      </div>

      {/* ── MODAL NOVA VENDA ── */}
      <Modal isOpen={newSaleModal} onClose={() => { setNewSaleModal(false); setSelectedSaleForEdit(null); }} title={selectedSaleForEdit ? 'Editar Venda' : 'Registrar Nova Venda'} size="lg">
        <form onSubmit={handleNewSale} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data da Venda *</label>
              <input type="date" className="input-field" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Semana</label>
              <input className="input-field" value={form.weekLabel}
                onChange={(e) => setForm((f) => ({ ...f, weekLabel: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Cliente *</label>
            <SearchableSelect
              placeholder="Selecionar cliente..."
              value={form.customerId}
              onChange={(val) => setForm((f) => ({ ...f, customerId: val }))}
              options={customers.map(c => ({ value: c.id, label: c.name }))}
              required
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Produtos *</label>
              <button type="button" onClick={addItem} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold">
                <Plus size={14} /> Adicionar Produto
              </button>
            </div>
            
            <div className="space-y-3">
              {form.items.map((item) => {
                const itemCost = Number(item.costPrice) || 0;
                const itemSale = Number(item.customPrice) || 0;
                
                return (
                  <div key={item.id} className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-3 relative">
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(item.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center hover:bg-rose-500/40 transition-colors z-10">
                        <X size={12} />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <SearchableSelect
                          placeholder="Selecionar produto..."
                          value={item.productId}
                          onChange={(val) => handleProductChange(item.id, val)}
                          options={products.map(p => ({ value: p.id, label: p.name, sublabel: formatCurrency(p.salePrice) }))}
                          required
                        />
                      </div>
                      <div>
                        <input className="input-field" placeholder="Tam/Num (opcional)" value={item.size}
                          onChange={(e) => updateItem(item.id, 'size', e.target.value)} />
                      </div>
                    </div>
                    {item.productId && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">Preço de Venda (R$)</label>
                          <input type="number" min="0" step="0.01" className="input-field py-1.5 text-sm" 
                            value={item.customPrice} 
                            onChange={(e) => updateItem(item.id, 'customPrice', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">Margem (%)</label>
                          <input type="number" step="0.1" className="input-field py-1.5 text-sm" 
                            value={itemCost > 0 ? ((itemSale - itemCost) / itemCost * 100).toFixed(1) : ''}
                            onChange={(e) => {
                              const newMargin = Number(e.target.value);
                              const newPrice = itemCost + (itemCost * newMargin / 100);
                              updateItem(item.id, 'customPrice', newPrice.toFixed(2));
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {form.items.some(i => i.productId) && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 mt-2">
              <div className="text-center"><p className="text-xs text-slate-500">Custo Total</p><p className="text-sm font-semibold text-slate-300">{formatCurrency(totalCost)}</p></div>
              <div className="text-center"><p className="text-xs text-slate-500">Venda Total</p><p className="text-sm font-semibold text-violet-300">{formatCurrency(totalSale)}</p></div>
              <div className="text-center"><p className="text-xs text-slate-500">Lucro Total</p><p className="text-sm font-semibold text-emerald-400">{formatCurrency(profit)}</p></div>
            </div>
          )}
          <div>
            <label className="label">Cliente Pagou (R$)</label>
            <input type="number" min="0" step="0.01" className="input-field" placeholder="0,00"
              value={form.amountPaid} onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))} />
          </div>
          {form.items.some(i => i.productId) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-800/50 rounded-xl text-center">
                <p className="text-xs text-slate-500">Restante</p>
                <p className={`text-sm font-bold ${remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{formatCurrency(remaining)}</p>
              </div>
              <div className="p-2.5 bg-slate-800/50 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <StatusBadge status={payStatus} />
              </div>
            </div>
          )}
          <div>
            <label className="label">Forma de Pagamento</label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" onClick={() => setForm((f) => ({ ...f, paymentMethod: value }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${form.paymentMethod === value ? 'bg-violet-600/20 border-violet-500/50 text-violet-300' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setNewSaleModal(false); setSelectedSaleForEdit(null); }} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : selectedSaleForEdit ? 'Salvar' : 'Confirmar Venda'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL EXCLUIR VENDA ── */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Excluir Venda" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Tem certeza que deseja excluir esta venda para{' '}
            <strong className="text-slate-100">"{selectedSaleForEdit?.customerName}"</strong>?
            <br />
            <span className="text-rose-400 text-xs mt-1 block">
              Esta ação não pode ser desfeita e os lembretes também serão apagados.
            </span>
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModalOpen(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button onClick={handleDeleteSale} disabled={submitting} className="btn-danger flex-1">
              {submitting ? (
                <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
              ) : (
                'Excluir'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL RECEBER PAGAMENTO ── */}
      <Modal isOpen={paymentModal} onClose={() => { setPaymentModal(false); setPaymentAmount(''); }} title="Registrar Pagamento" size="sm">
        {selectedSale && (
          <form onSubmit={handleRegisterPayment} className="space-y-4">
            <div className="p-3 bg-slate-800/50 rounded-xl space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Cliente</span><span className="text-slate-200 font-medium">{selectedSale.customerName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Produto</span><span className="text-slate-200">{selectedSale.productName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Valor da Venda</span><span className="text-slate-200">{formatCurrency(selectedSale.salePrice)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Já pago</span><span className="text-emerald-400 font-medium">{formatCurrency(selectedSale.amountPaid)}</span></div>
              <div className="flex justify-between text-sm border-t border-slate-700 pt-1.5"><span className="text-amber-400 font-semibold">Restante</span><span className="text-amber-400 font-bold">{formatCurrency(selectedSale.remainingBalance)}</span></div>
            </div>
            <div>
              <label className="label">Valor Recebido Agora (R$) *</label>
              <input type="number" min="0.01" step="0.01" max={selectedSale.remainingBalance}
                className="input-field" placeholder="0,00" value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)} required autoFocus />
              <p className="text-xs text-slate-500 mt-1">Máx: {formatCurrency(selectedSale.remainingBalance)}</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setPaymentModal(false); setPaymentAmount(''); }} className="btn-secondary flex-1">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── MODAL LEMBRETE DE COBRANÇA ── */}
      <Modal isOpen={reminderModal} onClose={() => setReminderModal(false)} title="Lembrete de Cobrança" size="sm">
        {selectedSale && (
          <div className="space-y-4">
            {/* Sale info */}
            <div className="flex items-center gap-3 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
              <Bell size={16} className="text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-200">{selectedSale.customerName}</p>
                <p className="text-xs text-slate-400">{selectedSale.productName} · Deve: <span className="text-amber-400 font-bold">{formatCurrency(selectedSale.remainingBalance)}</span></p>
              </div>
            </div>

            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="label">Data para cobrar *</label>
                <input type="date" className="input-field" value={reminderForm.dueDate}
                  onChange={(e) => setReminderForm((f) => ({ ...f, dueDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]} required />
              </div>
              <div>
                <label className="label">Valor a cobrar (R$)</label>
                <input type="number" min="0" step="0.01" className="input-field" placeholder="0,00"
                  value={reminderForm.amountToCollect}
                  onChange={(e) => setReminderForm((f) => ({ ...f, amountToCollect: e.target.value }))} />
                <p className="text-xs text-slate-500 mt-1">Deixe em branco para cobrar o total devedor</p>
              </div>
              <div>
                <label className="label">Observação</label>
                <textarea className="input-field resize-none" rows={2}
                  placeholder="ex: ligar no almoço, mandar mensagem no WhatsApp..."
                  value={reminderForm.note}
                  onChange={(e) => setReminderForm((f) => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setReminderModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Criar Lembrete'}
                </button>
              </div>
            </form>

            {/* Lembretes existentes desta venda */}
            {remindersBySale[selectedSale?.id]?.length > 0 && (
              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Lembretes desta venda</p>
                <div className="space-y-2">
                  {remindersBySale[selectedSale.id].map((rem) => (
                    <div key={rem.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${rem.done ? 'bg-slate-800/20 border-slate-800/30 opacity-50' : 'bg-slate-800/40 border-slate-700/50'}`}>
                      <button onClick={() => handleToggleReminder(rem)}
                        className={`flex-shrink-0 transition-colors ${rem.done ? 'text-emerald-400' : 'text-slate-600 hover:text-emerald-400'}`}>
                        <CheckCircle2 size={15} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${rem.done ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                          {rem.dueDate ? formatDate(rem.dueDate) : '—'}
                          {rem.amountToCollect > 0 && <span className="ml-2 text-emerald-400">{formatCurrency(rem.amountToCollect)}</span>}
                        </p>
                        {rem.note && <p className="text-xs text-slate-500 truncate">{rem.note}</p>}
                      </div>
                      <button onClick={() => handleDeleteReminder(rem.id)} className="text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Sales;
