/**
 * Format a number as Brazilian Real currency
 */
export const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
};

/**
 * Format a Firestore Timestamp or Date to a localized date string
 */
export const formatDate = (value) => {
  if (!value) return '—';
  let date;
  if (value?.toDate) {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Format a Firestore Timestamp or Date to short date string
 */
export const formatShortDate = (value) => {
  if (!value) return '—';
  let date;
  if (value?.toDate) {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

/**
 * Return Tailwind CSS classes for payment status badge
 */
export const getStatusClasses = (status) => {
  switch (status) {
    case 'Total Pago':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    case 'Pago Parcial':
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'Pendente':
    default:
      return {
        bg: 'bg-rose-500/15',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        dot: 'bg-rose-400',
      };
  }
};

/**
 * Get initials from a name string
 */
export const getInitials = (name = '') => {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
};

/**
 * Generate a week label like "semana 03.08 a 07.08"
 */
export const getCurrentWeekLabel = () => {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d) =>
    `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `semana ${fmt(monday)} a ${fmt(friday)}`;
};
