import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRemindersRealtime } from '../../services/reminderService';

const routeTitles = {
  '/': 'Dashboard',
  '/produtos': 'Produtos',
  '/clientes': 'Clientes',
  '/vendas': 'Vendas',
};

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const title = routeTitles[location.pathname] || 'Painel';

  const [reminders, setReminders] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    try {
      const unsubscribe = getRemindersRealtime((data) => {
        setReminders(data.filter((r) => !r.done));
      });
      return () => unsubscribe();
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    }
  }, []);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        <p className="text-xs text-slate-500">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 text-slate-100 placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50 w-48"
          />
        </div>

        {/* Notificações */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors relative"
          >
            <Bell size={16} />
            {reminders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {reminders.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">Notificações</span>
                <span className="text-xs text-slate-500">{reminders.length} pendentes</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {reminders.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    Nenhum lembrete pendente.
                  </div>
                ) : (
                  reminders.map((rem) => (
                    <div key={rem.id} className="p-3 border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                      <p className="text-sm text-slate-200">{rem.title}</p>
                      <p className="text-xs text-slate-400 mt-1">Vence em: {rem.dueDate}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botão de Conta (Logout) */}
        <button 
          onClick={logout}
          title="Sair da conta"
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white hover:from-rose-500 hover:to-red-600 transition-all cursor-pointer group relative"
        >
          <span className="group-hover:hidden">{(user?.email?.[0] || 'U').toUpperCase()}</span>
          <LogOut size={14} className="hidden group-hover:block" />
        </button>
      </div>
    </header>
  );
};

export default Header;
