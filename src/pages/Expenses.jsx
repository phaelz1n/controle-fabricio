import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Trash2,
  Wallet,
  CheckCircle2,
  ArrowRightLeft,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import {
  getExpensesRealtime,
  registerExpense,
  deleteExpense,
} from '../services/expenseService';
import {
  getCreditsRealtime,
  registerCredit,
  markCreditAsUsed,
  deleteCredit,
} from '../services/creditService';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [expenseModal, setExpenseModal] = useState(false);
  const [creditModal, setCreditModal] = useState(false);

  // Forms state
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [creditForm, setCreditForm] = useState({ supplier: '', amount: '', date: new Date().toISOString().split('T')[0] });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubExpenses = getExpensesRealtime((data) => {
      setExpenses(data);
      setLoading(false);
    });
    const unsubCredits = getCreditsRealtime(setCredits);
    return () => { unsubExpenses(); unsubCredits(); };
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerExpense(expenseForm);
      toast.success('Gasto registrado!');
      setExpenseModal(false);
      setExpenseForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    } catch {
      toast.error('Erro ao registrar gasto.');
    } finally {
      setSubmitting(false);
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

  const handleAddCredit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerCredit(creditForm);
      toast.success('Saldo com fornecedor registrado!');
      setCreditModal(false);
      setCreditForm({ supplier: '', amount: '', date: new Date().toISOString().split('T')[0] });
    } catch {
      toast.error('Erro ao registrar saldo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCredit = async (id) => {
    try {
      await deleteCredit(id);
      toast.success('Registro removido!');
    } catch {
      toast.error('Erro ao remover saldo.');
    }
  };

  const handleToggleCredit = async (credit) => {
    try {
      const isUsed = credit.status === 'used';
      await markCreditAsUsed(credit.id, !isUsed);
      toast.success(isUsed ? 'Marcado como Em Aberto!' : 'Marcado como Utilizado!');
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  };

  const activeCredits = credits.filter(c => c.status === 'active');
  const usedCredits = credits.filter(c => c.status === 'used');

  const totalDespesas = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalCreditosAbertos = activeCredits.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100">Despesas e Fornecedores</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Gerencie gastos extras e saldos positivos/adiantamentos com fornecedores
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-rose-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Despesas (Todo Período)</p>
            <p className="text-xl font-bold text-rose-300">{formatCurrency(totalDespesas)}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Wallet size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldos Abertos (Fornecedores)</p>
            <p className="text-xl font-bold text-amber-300">{formatCurrency(totalCreditosAbertos)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* ── GASTOS EXTRAS ── */}
        <div className="glass-card p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400" />
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Gastos Extras (Despesas)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Custos além da compra de tênis</p>
              </div>
            </div>
            <button
              onClick={() => setExpenseModal(true)}
              className="btn-danger text-xs py-1.5 px-3"
            >
              <Plus size={14} />
              Despesa
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[500px]">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">Nenhum gasto extra registrado.</div>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{exp.description}</p>
                    <p className="text-xs text-slate-500">{formatDate(exp.date)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-rose-400 font-bold">{formatCurrency(exp.amount)}</span>
                    <button onClick={() => handleDeleteExpense(exp.id)} className="text-slate-600 hover:text-rose-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── SALDOS COM FORNECEDORES ── */}
        <div className="glass-card p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ArrowRightLeft size={16} className="text-amber-400" />
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Saldos Positivos (Fornecedores)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Adiantamentos ou compras canceladas</p>
              </div>
            </div>
            <button
              onClick={() => setCreditModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/20 transition-all"
            >
              <Plus size={14} />
              Adicionar Saldo
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[500px]">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : credits.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">Nenhum saldo registrado.</div>
            ) : (
              <>
                {/* Em Aberto */}
                {activeCredits.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-amber-500/80 mb-2">Em Aberto (Descontam do Caixa)</p>
                    {activeCredits.map((credit) => (
                      <div key={credit.id} className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                        <button
                          onClick={() => handleToggleCredit(credit)}
                          className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors"
                          title="Marcar como utilizado"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-amber-100">{credit.supplier}</p>
                          <p className="text-xs text-amber-500/60">{formatDate(credit.date)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-amber-400 font-bold">{formatCurrency(credit.amount)}</span>
                          <button onClick={() => handleDeleteCredit(credit.id)} className="text-slate-600 hover:text-rose-400 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Utilizados */}
                {usedCredits.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-bold text-slate-600 mb-2">Já Utilizados (Resolvidos)</p>
                    {usedCredits.map((credit) => (
                      <div key={credit.id} className="flex items-start gap-3 p-3 bg-slate-800/20 border border-slate-800/40 rounded-xl opacity-60">
                        <button
                          onClick={() => handleToggleCredit(credit)}
                          className="mt-0.5 text-emerald-500 transition-colors"
                          title="Voltar para em aberto"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-400 line-through">{credit.supplier}</p>
                          <p className="text-xs text-slate-500">{formatDate(credit.date)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-bold">{formatCurrency(credit.amount)}</span>
                          <button onClick={() => handleDeleteCredit(credit.id)} className="text-slate-700 hover:text-rose-400 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL GASTO EXTRA ── */}
      <Modal isOpen={expenseModal} onClose={() => setExpenseModal(false)} title="Adicionar Gasto Extra / Ajuste" size="sm">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="p-3 bg-slate-800/50 rounded-xl text-xs text-slate-400 leading-relaxed mb-2">
            Despesas não relacionadas a estoque ou ajustes de caixa para bater com seu banco.
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
            <button type="submit" disabled={submitting} className="btn-danger flex-1">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL SALDO FORNECEDOR ── */}
      <Modal isOpen={creditModal} onClose={() => setCreditModal(false)} title="Adicionar Saldo Positivo" size="sm">
        <form onSubmit={handleAddCredit} className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/80 leading-relaxed mb-2">
            Use para registrar dinheiro enviado a fornecedores de compras canceladas. Isso descontará do seu <strong>Caixa Atual</strong> enquanto estiver "Em Aberto".
          </div>
          <div>
            <label className="label">Fornecedor ou Motivo</label>
            <input 
              type="text" className="input-field" placeholder="ex: Fornecedor XYZ"
              value={creditForm.supplier} onChange={(e) => setCreditForm({...creditForm, supplier: e.target.value})} required autoFocus 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$)</label>
              <input 
                type="number" min="0" step="0.01" className="input-field" placeholder="0,00"
                value={creditForm.amount} onChange={(e) => setCreditForm({...creditForm, amount: e.target.value})} required 
              />
            </div>
            <div>
              <label className="label">Data do Envio</label>
              <input 
                type="date" className="input-field"
                value={creditForm.date} onChange={(e) => setCreditForm({...creditForm, date: e.target.value})} required 
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCreditModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 !bg-amber-500 hover:!bg-amber-600 !border-amber-400">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Registrar Saldo'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Expenses;
