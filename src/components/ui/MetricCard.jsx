import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'violet',
  subtitle,
}) => {
  const colorMap = {
    violet: {
      icon: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
      glow: 'hover:shadow-violet-500/10',
    },
    emerald: {
      icon: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      glow: 'hover:shadow-emerald-500/10',
    },
    amber: {
      icon: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      glow: 'hover:shadow-amber-500/10',
    },
    rose: {
      icon: 'text-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/20',
      glow: 'hover:shadow-rose-500/10',
    },
    blue: {
      icon: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      glow: 'hover:shadow-blue-500/10',
    },
  };

  const c = colorMap[color] || colorMap.violet;

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-emerald-400'
      : trend === 'down'
      ? 'text-rose-400'
      : 'text-slate-400';

  return (
    <div
      className={`metric-card group cursor-default hover:shadow-lg ${c.glow} transition-shadow duration-300 animate-fade-in`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center border ${c.iconBg}`}
        >
          {Icon && <Icon size={20} className={c.icon} />}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={13} />
            {trendLabel}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold text-slate-100 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default MetricCard;
