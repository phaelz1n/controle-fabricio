import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, formatShortDate } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 shadow-xl">
        <p className="text-xs font-semibold text-slate-400 mb-2">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RevenueChart = ({ data = [] }) => {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={{ stroke: '#1e293b' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${v}`}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '12px' }}
        />
        <Area
          type="monotone"
          dataKey="receita"
          name="Receita"
          stroke="#8b5cf6"
          strokeWidth={2}
          fill="url(#colorReceita)"
          dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="lucro"
          name="Lucro"
          stroke="#34d399"
          strokeWidth={2}
          fill="url(#colorLucro)"
          dot={{ fill: '#34d399', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
