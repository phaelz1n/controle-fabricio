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
} from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

import {
  getSalesRealtime,
  createSale,
  registerPayment,
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
  const [selectedSale, setSelectedSale] = useState(null);

  const [form, setForm] = useState({
    customerId: '', productId: '', amountPaid: '',
    paymentMethod: 'PIX',
    date: new Date().toISOString().split('T')[0],
    weekLabel: getCurrentWeekLabel(),
    size: '',
  });

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

  const selectedProduct = products.find((p) => p.id === form.productId);
  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  const amountPaid = Number(form.amountPaid) || 0;
  const salePrice = selectedProduct?.salePrice || 0;
  const costPrice = selectedProduct?.costPrice || 0;
  const remaining = Math.max(0, salePrice - amountPaid);
  const profit = salePrice - costPrice;
  const payStatus = amountPaid <= 0 ? 'Pendente' : amountPaid >= salePrice ? 'Total Pago' : 'Pago Parcial';

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

  const handleNewSale = async (e) => {
    e.preventDefault();
    if (!form.customerId) { toast.error('Selecione um cliente.'); return; }
    if (!form.productId) { toast.error('Selecione um produto.'); return; }
    if (!selectedProduct) return;
    setSubmitting(true);
    try {

      await createSale({
        customerId: form.customerId, customerName: selectedCustomer?.name || '',
        productId: form.productId, productName: selectedProduct.name,
        costPrice: selectedProduct.costPrice, salePrice: selectedProduct.salePrice,
        amountPaid: form.amountPaid, paymentMethod: form.paymentMethod,
        date: form.date, weekLabel: form.weekLabel, size: form.size,
      });
      toast.success('Venda registrada com sucesso!');
      setNewSaleModal(false);
      setForm({ customerId: '', productId: '', amountPaid: '', paymentMethod: 'PIX', date: new Date().toISOString().split('T')[0], weekLabel: getCurrentWeekLabel(), size: '' });
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
        <button id="btn-add-sale" onClick={() => setNewSaleModal(true)} className="btn-primary">
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
              </div>
            )}
          />
        )}
      </div>

      {/* ── MODAL NOVA VENDA ── */}
      <Modal isOpen={newSaleModal} onClose={() => setNewSaleModal(false)} title="Registrar Nova Venda" size="lg">
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
            <select className="input-field" value={form.customerId}
              onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} required>
              <option value="">Selecionar cliente...</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Produto *</label>
              <select className="input-field" value={form.productId}
                onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))} required>
                <option value="">Selecionar produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.salePrice)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tamanho / Num.</label>
              <input className="input-field" placeholder="ex: 38" value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))} />
            </div>
          </div>
          {selectedProduct && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="text-center"><p className="text-xs text-slate-500">Custo</p><p className="text-sm font-semibold text-slate-300">{formatCurrency(costPrice)}</p></div>
              <div className="text-center"><p className="text-xs text-slate-500">Venda</p><p className="text-sm font-semibold text-violet-300">{formatCurrency(salePrice)}</p></div>
              <div className="text-center"><p className="text-xs text-slate-500">Lucro</p><p className="text-sm font-semibold text-emerald-400">{formatCurrency(profit)}</p></div>
            </div>
          )}
          <div>
            <label className="label">Cliente Pagou (R$)</label>
            <input type="number" min="0" step="0.01" className="input-field" placeholder="0,00"
              value={form.amountPaid} onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))} />
          </div>
          {selectedProduct && (
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
            <button type="button" onClick={() => setNewSaleModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmar Venda'}
            </button>
          </div>
        </form>
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
