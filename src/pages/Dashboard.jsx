import { useEffect, useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Package,
  ShoppingBag,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Info,
  Trophy,
  Bell,
  CheckCircle2,
  Trash2,
  CalendarClock,
  Printer,
  Filter,
  Plus,
} from 'lucide-react';
import MetricCard from '../components/ui/MetricCard';
import StatusBadge from '../components/ui/StatusBadge';
import RevenueChart from '../components/charts/RevenueChart';
import Modal from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';

import { getSalesRealtime } from '../services/salesService';
import { getProductsRealtime } from '../services/productService';
import { getPurchasesRealtime } from '../services/purchaseService';
import { getFinancialSettings, saveFinancialSettings } from '../services/settingsService';
import {
  getRemindersRealtime,
  toggleReminderDone,
  deleteReminder,
} from '../services/reminderService';
import {
  getExpensesRealtime,
  registerExpense,
  deleteExpense,
} from '../services/expenseService';
import { formatCurrency, formatDate, formatShortDate, getInitials } from '../utils/formatters';
import toast from 'react-hot-toast';

const CAPITAL_KEY = 'demo_capital_inicial';

const Dashboard = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [expenses, setExpenses] = useState([]);
  
  // Capital settings
  const [capitalInicial, setCapitalInicial] = useState(0);
  const [capitalModal, setCapitalModal] = useState(false);
  const [capitalInput, setCapitalInput] = useState('');
  const [savingCapital, setSavingCapital] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');

  // Expense modal state
  const [expenseModal, setExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Load data
  useEffect(() => {

    const unsubSales = getSalesRealtime((data) => { setSales(data); setLoadingSales(false); });
    const unsubProducts = getProductsRealtime(setProducts);
    const unsubPurchases = getPurchasesRealtime(setPurchases);
    const unsubReminders = getRemindersRealtime(setReminders);
    const unsubExpenses = getExpensesRealtime(setExpenses);
    getFinancialSettings().then((s) => { if (s?.capitalInicial) setCapitalInicial(Number(s.capitalInicial)); });
    return () => { unsubSales(); unsubProducts(); unsubPurchases(); unsubReminders(); unsubExpenses(); };
  }, [user]);

  const handleSaveCapital = async (e) => {
    e.preventDefault();
    setSavingCapital(true);
    const valor = Number(capitalInput) || 0;
    try {
      await saveFinancialSettings({ capitalInicial: valor });
      setCapitalInicial(valor);
      setCapitalModal(false);
      toast.success('Capital inicial salvo!');
    } catch {
      toast.error('Erro ao salvar capital.');
    } finally {
      setSavingCapital(false);
    }
  };

  const handleToggleReminder = (rem) => {
    toggleReminderDone(rem.id, rem.done);
  };

  const handleDeleteReminder = (id) => {
    deleteReminder(id);
    toast.success('Lembrete removido!');
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSubmittingExpense(true);
    try {
      await registerExpense(expenseForm);
      toast.success('Gasto extra registrado!');
      setExpenseModal(false);
      setExpenseForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    } catch {
      toast.error('Erro ao registrar gasto.');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      toast.success('Gasto removido!');
    } catch {
      toast.error('Erro ao remover gasto.');
    }
  };

  // ── Filtros ──────────────────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    const today = new Date();
    return sales.filter((s) => {
      if (dateFilter === 'all') return true;
      const d = new Date(s.date || s.createdAt);
      if (dateFilter === 'today') return d.toDateString() === today.toDateString();
      if (dateFilter === 'month') return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      if (dateFilter === 'year') return d.getFullYear() === today.getFullYear();
      return true;
    });
  }, [sales, dateFilter]);

  const filteredPurchases = useMemo(() => {
    const today = new Date();
    return purchases.filter((p) => {
      if (dateFilter === 'all') return true;
      const d = new Date(p.date || p.createdAt);
      if (dateFilter === 'today') return d.toDateString() === today.toDateString();
      if (dateFilter === 'month') return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      if (dateFilter === 'year') return d.getFullYear() === today.getFullYear();
      return true;
    });
  }, [purchases, dateFilter]);

  const filteredExpenses = useMemo(() => {
    const today = new Date();
    return expenses.filter((e) => {
      if (dateFilter === 'all') return true;
      const d = new Date(e.date || e.createdAt);
      if (dateFilter === 'today') return d.toDateString() === today.toDateString();
      if (dateFilter === 'month') return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      if (dateFilter === 'year') return d.getFullYear() === today.getFullYear();
      return true;
    });
  }, [expenses, dateFilter]);

  // ── Financial calculations ────────────────────────────────────────────
  const finance = useMemo(() => {
    const totalGastoCompras = filteredPurchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
    const totalGastosExtras = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalRecebido = filteredSales.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
    
    const aReceber = filteredSales.reduce((sum, s) => sum + (s.remainingBalance || 0), 0);
    const lucroRealizado = filteredSales.reduce((sum, s) => {
      const paid = s.amountPaid || 0;
      const cost = s.costPrice || 0;
      if (paid <= 0) return sum;
      const ratio = s.salePrice > 0 ? Math.min(paid / s.salePrice, 1) : 0;
      return sum + paid - cost * ratio;
    }, 0);
    
    const caixaAtual = capitalInicial - totalGastoCompras - totalGastosExtras + totalRecebido;
    
    return { totalRecebido, totalGastoCompras, totalGastosExtras, aReceber, lucroRealizado, caixaAtual };
  }, [filteredSales, filteredPurchases, filteredExpenses, capitalInicial]);

  // ── Top Compradores ───────────────────────────────────────────────────
  const topBuyers = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const key = s.customerId || s.customerName;
      if (!map[key]) map[key] = { name: s.customerName, totalPaid: 0, totalDebt: 0, count: 0 };
      map[key].totalPaid += s.amountPaid || 0;
      map[key].totalDebt += s.remainingBalance || 0;
      map[key].count += 1;
    });
    return Object.values(map)
      .sort((a, b) => (b.totalPaid + b.totalDebt) - (a.totalPaid + a.totalDebt))
      .slice(0, 5);
  }, [filteredSales]);

  // ── Reminders split ───────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pendingReminders = reminders.filter((r) => !r.done);
  const overdueReminders = pendingReminders.filter((r) => r.dueDate && new Date(r.dueDate) < today);

  const chartData = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const key = s.weekLabel || formatShortDate(s.date || s.createdAt);
      if (!map[key]) map[key] = { label: key, receita: 0, lucro: 0 };
      map[key].receita += s.amountPaid || 0;
      map[key].lucro += (s.amountPaid || 0) - (s.costPrice || 0);
    });
    return Object.values(map).slice(-8).reverse();
  }, [filteredSales]);

  const recentSales = filteredSales.slice(0, 8);

  const medalColors = ['text-amber-400', 'text-slate-300', 'text-amber-600'];
  const medalBg = ['bg-amber-500/10 border-amber-500/20', 'bg-slate-500/10 border-slate-500/20', 'bg-amber-700/10 border-amber-700/20'];

  return (
    <div className="space-y-6 animate-fade-in print:space-y-4">

      {/* ── HEADER DA DASHBOARD (Filtros & Exportação) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-violet-400" />
          <h2 className="text-lg font-bold text-slate-100">Filtro:</h2>
          <select 
            className="input-field py-1.5 px-3 w-40 font-medium"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">Todo o Período</option>
            <option value="today">Hoje</option>
            <option value="month">Este Mês</option>
            <option value="year">Este Ano</option>
          </select>
        </div>
        
        <button 
          onClick={() => window.print()}
          className="btn-secondary"
        >
          <Printer size={16} />
          Exportar Relatório PDF
        </button>
      </div>

      {/* Título apenas para Impressão */}
      <div className="hidden print:block mb-4 text-center">
        <h1 className="text-2xl font-bold">Relatório Financeiro</h1>
        <p className="text-sm">Período: {dateFilter === 'today' ? 'Hoje' : dateFilter === 'month' ? 'Este Mês' : dateFilter === 'year' ? 'Este Ano' : 'Todo o Período'}</p>
      </div>

      {/* ── POSIÇÃO FINANCEIRA ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Wallet size={16} className="text-violet-400" />
              Posição Financeira
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Onde está o seu dinheiro agora</p>
          </div>
          <button
            onClick={() => { setCapitalInput(String(capitalInicial || '')); setCapitalModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-violet-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all print:hidden"
          >
            <Settings size={13} />
            {capitalInicial > 0 ? 'Editar capital' : 'Definir capital inicial'}
          </button>
        </div>

        {capitalInicial === 0 && (
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Info size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              Defina o <strong>capital inicial</strong> que você investiu no negócio para ver o cálculo do seu caixa atual.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1">Capital Investido</p>
            <p className="text-lg font-bold text-slate-100">{formatCurrency(capitalInicial)}</p>
            <p className="text-xs text-slate-600 mt-1">Dinheiro que você entrou</p>
          </div>
          <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/15">
            <div className="flex items-center gap-1 mb-1">
              <Clock size={13} className="text-amber-400" />
              <p className="text-xs text-amber-400/80">A Receber</p>
            </div>
            <p className="text-lg font-bold text-amber-300">{formatCurrency(finance.aReceber)}</p>
            <p className="text-xs text-slate-600 mt-1">{filteredSales.filter((s) => s.paymentStatus !== 'Total Pago').length} venda(s) em aberto</p>
          </div>
          <div className={`p-4 rounded-xl border ${finance.caixaAtual >= 0 ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-rose-500/10 border-rose-500/25'}`}>
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpRight size={13} className={finance.caixaAtual >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
              <p className={`text-xs font-semibold ${finance.caixaAtual >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>Caixa Atual</p>
            </div>
            <p className={`text-xl font-bold ${finance.caixaAtual >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatCurrency(finance.caixaAtual)}</p>
            <p className="text-xs text-slate-600 mt-1">Dinheiro disponível</p>
          </div>
        </div>

        <div className="mt-4 px-4 py-3 bg-slate-800/30 rounded-xl border border-slate-800 flex flex-col gap-2">
          <p className="text-xs text-slate-500 font-medium mb-1">Como é calculado:</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 font-mono leading-relaxed">
            <span><span className="text-slate-200">{formatCurrency(capitalInicial)}</span> (capital)</span>
            <span className="text-rose-400">− {formatCurrency(finance.totalGastoCompras)} <span className="text-slate-500">(compras)</span></span>
            {finance.totalGastosExtras > 0 && (
              <span className="text-rose-400">− {formatCurrency(finance.totalGastosExtras)} <span className="text-slate-500">(extras)</span></span>
            )}
            <span className="text-emerald-400">+ {formatCurrency(finance.totalRecebido)} <span className="text-slate-500">(recebido)</span></span>
            <span className="text-slate-500">=</span>
            <span className={`font-bold ${finance.caixaAtual >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatCurrency(finance.caixaAtual)}</span>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total Recebido" value={formatCurrency(finance.totalRecebido)} icon={DollarSign} color="violet" subtitle={`${filteredSales.length} venda(s) no total`} />
        <MetricCard title="Lucro Realizado" value={formatCurrency(finance.lucroRealizado)} icon={TrendingUp} color="emerald" subtitle="Receita menos custo das vendas pagas" />
        <MetricCard title="A Receber" value={formatCurrency(finance.aReceber)} icon={Clock} color="amber" subtitle={`${filteredSales.filter((s) => s.paymentStatus !== 'Total Pago').length} vendas em aberto`} />
      </div>

      {/* ── TOP COMPRADORES + LEMBRETES ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Top Compradores */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Trophy size={16} className="text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Top Compradores</h3>
              <p className="text-xs text-slate-500 mt-0.5">Clientes que mais compraram</p>
            </div>
          </div>

          {topBuyers.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Nenhuma venda registrada ainda</p>
          ) : (
            <div className="space-y-3">
              {topBuyers.map((buyer, i) => {
                const total = buyer.totalPaid + buyer.totalDebt;
                const pct = topBuyers[0] ? (total / (topBuyers[0].totalPaid + topBuyers[0].totalDebt)) * 100 : 0;
                return (
                  <div key={buyer.name} className="flex items-center gap-3">
                    {/* Rank */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border flex-shrink-0 ${i < 3 ? medalBg[i] : 'bg-slate-800/60 border-slate-700'} ${i < 3 ? medalColors[i] : 'text-slate-500'}`}>
                      {i + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400 flex-shrink-0">
                      {getInitials(buyer.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-slate-200 truncate">{buyer.name}</p>
                        <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{buyer.count} compra{buyer.count !== 1 ? 's' : ''}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-emerald-400">{formatCurrency(buyer.totalPaid)} pago</span>
                        {buyer.totalDebt > 0 && (
                          <span className="text-xs text-amber-400">{formatCurrency(buyer.totalDebt)} a dever</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lembretes de Cobrança */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Bell size={16} className={overdueReminders.length > 0 ? 'text-rose-400' : 'text-violet-400'} />
              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  Lembretes de Cobrança
                  {pendingReminders.length > 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${overdueReminders.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-violet-500/20 text-violet-400'}`}>
                      {pendingReminders.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Defina lembretes na aba Vendas</p>
              </div>
            </div>
          </div>

          {reminders.length === 0 ? (
            <div className="text-center py-6">
              <CalendarClock size={28} className="text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhum lembrete criado</p>
              <p className="text-xs text-slate-600 mt-1">Adicione lembretes de cobrança na aba Vendas</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {[...reminders]
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .map((rem) => {
                  const isOverdue = !rem.done && rem.dueDate && new Date(rem.dueDate) < today;
                  const isToday = rem.dueDate && new Date(rem.dueDate).toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={rem.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                        rem.done
                          ? 'bg-slate-800/20 border-slate-800/30 opacity-50'
                          : isOverdue
                          ? 'bg-rose-500/8 border-rose-500/20'
                          : isToday
                          ? 'bg-amber-500/8 border-amber-500/20'
                          : 'bg-slate-800/30 border-slate-800/50'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleReminder(rem)}
                        className={`mt-0.5 flex-shrink-0 transition-colors ${rem.done ? 'text-emerald-400' : 'text-slate-600 hover:text-emerald-400'}`}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${rem.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {rem.customerName}
                        </p>
                        {rem.note && <p className="text-xs text-slate-400 mt-0.5 truncate">{rem.note}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          {rem.dueDate && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${
                              rem.done ? 'bg-slate-800 text-slate-500'
                              : isOverdue ? 'bg-rose-500/15 text-rose-400'
                              : isToday ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                            }`}>
                              {isOverdue && !rem.done ? '⚠ ' : ''}{formatDate(rem.dueDate)}
                            </span>
                          )}
                          {rem.amountToCollect > 0 && (
                            <span className="text-xs text-emerald-400 font-medium">{formatCurrency(rem.amountToCollect)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteReminder(rem.id)}
                        className="text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ── GASTOS EXTRAS ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Gastos Extras (Despesas)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Custos que afetam o caixa além da compra de tênis</p>
            </div>
          </div>
          <button
            onClick={() => setExpenseModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-all"
          >
            <Plus size={13} />
            Adicionar Despesa
          </button>
        </div>

        {filteredExpenses.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Nenhum gasto extra registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="pb-3 text-left table-header">Data</th>
                  <th className="pb-3 text-left table-header">Descrição</th>
                  <th className="pb-3 text-right table-header">Valor</th>
                  <th className="pb-3 text-right table-header"></th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="table-row">
                    <td className="py-3 text-slate-400 text-xs">{formatDate(exp.date)}</td>
                    <td className="py-3 text-slate-300">{exp.description}</td>
                    <td className="py-3 text-right text-rose-400 font-medium">{formatCurrency(exp.amount)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Excluir Gasto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── GRÁFICO ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Receita & Lucro por Semana</h3>
            <p className="text-xs text-slate-500 mt-0.5">Evolução das últimas semanas</p>
          </div>
        </div>
        {chartData.length > 0 ? <RevenueChart data={chartData} /> : (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Nenhum dado para exibir ainda</div>
        )}
      </div>

      {/* ── ÚLTIMAS VENDAS ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Últimas Vendas</h3>
            <p className="text-xs text-slate-500 mt-0.5">As 8 vendas mais recentes</p>
          </div>
          <ShoppingBag size={16} className="text-slate-500" />
        </div>
        {loadingSales ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : recentSales.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Nenhuma venda registrada ainda</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="pb-3 text-left table-header">Data</th>
                  <th className="pb-3 text-left table-header">Cliente</th>
                  <th className="pb-3 text-left table-header">Produto</th>
                  <th className="pb-3 text-right table-header">Venda</th>
                  <th className="pb-3 text-right table-header">Pago</th>
                  <th className="pb-3 text-right table-header">Restante</th>
                  <th className="pb-3 text-right table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s) => (
                  <tr key={s.id} className="table-row">
                    <td className="py-3 text-slate-400 text-xs">{formatDate(s.date || s.createdAt)}</td>
                    <td className="py-3 text-slate-300 font-medium">{s.customerName}</td>
                    <td className="py-3 text-slate-400">
                      {s.productName}
                      {s.size && <span className="ml-2 px-1.5 py-0.5 bg-slate-800 text-xs rounded border border-slate-700">Tam: {s.size}</span>}
                    </td>
                    <td className="py-3 text-right text-slate-300">{formatCurrency(s.salePrice)}</td>
                    <td className="py-3 text-right text-emerald-400 font-medium">{formatCurrency(s.amountPaid)}</td>
                    <td className="py-3 text-right text-amber-400">{formatCurrency(s.remainingBalance)}</td>
                    <td className="py-3 text-right"><StatusBadge status={s.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL CAPITAL INICIAL ── */}
      <Modal isOpen={capitalModal} onClose={() => setCapitalModal(false)} title="Capital Inicial do Negócio" size="sm">
        <form onSubmit={handleSaveCapital} className="space-y-4">
          <div className="p-4 bg-slate-800/50 rounded-xl space-y-2 text-xs text-slate-400 leading-relaxed">
            <p>Informe o <strong className="text-slate-200">total que você investiu</strong> para entrar no negócio.</p>
            <p>O sistema calcula quanto ainda está no seu caixa considerando o estoque atual e as vendas realizadas.</p>
          </div>
          <div>
            <label className="label">Valor investido (R$)</label>
            <input type="number" min="0" step="0.01" className="input-field text-lg font-semibold" placeholder="ex: 2000,00"
              value={capitalInput} onChange={(e) => setCapitalInput(e.target.value)} autoFocus required />
          </div>
          {capitalInput && (
            <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs text-violet-300">
              <p className="font-semibold mb-1">Prévia:</p>
              <p>Capital: <strong>{formatCurrency(Number(capitalInput))}</strong></p>
              <p>− Compras registradas: <strong className="text-rose-300">{formatCurrency(finance.totalGastoCompras)}</strong></p>
              <p>+ Recebido de clientes: <strong className="text-emerald-300">{formatCurrency(finance.totalRecebido)}</strong></p>
              <div className="border-t border-violet-500/20 mt-2 pt-2">
                <p className="font-bold text-base">= Caixa: <span className={Number(capitalInput) - finance.totalGastoCompras + finance.totalRecebido >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                  {formatCurrency(Number(capitalInput) - finance.totalGastoCompras + finance.totalRecebido)}
                </span></p>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setCapitalModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={savingCapital} className="btn-primary flex-1">
              {savingCapital ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL GASTO EXTRA ── */}
      <Modal isOpen={expenseModal} onClose={() => setExpenseModal(false)} title="Adicionar Gasto Extra / Ajuste" size="sm">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="p-3 bg-slate-800/50 rounded-xl text-xs text-slate-400 leading-relaxed mb-2">
            Use para registrar despesas não relacionadas a estoque (ex: frete extra, embalagens, lanches) ou <strong>ajustes de caixa</strong> para bater com seu banco.
          </div>
          <div>
            <label className="label">Descrição</label>
            <input 
              type="text" className="input-field" placeholder="ex: Ajuste de Saldo, Embalagens..."
              value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} required autoFocus 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$)</label>
              <input 
                type="number" min="0" step="0.01" className="input-field" placeholder="0,00"
                value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} required 
              />
            </div>
            <div>
              <label className="label">Data</label>
              <input 
                type="date" className="input-field"
                value={expenseForm.date} onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})} required 
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setExpenseModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={submittingExpense} className="btn-danger flex-1">
              {submittingExpense ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
