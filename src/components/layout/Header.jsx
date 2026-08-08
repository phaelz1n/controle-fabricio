import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const routeTitles = {
  '/': 'Dashboard',
  '/produtos': 'Produtos',
  '/clientes': 'Clientes',
  '/vendas': 'Vendas',
};

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();
  const title = routeTitles[location.pathname] || 'Painel';

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
        <button className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
          {(user?.email?.[0] || 'U').toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
