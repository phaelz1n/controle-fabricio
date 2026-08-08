import { getStatusClasses } from '../../utils/formatters';

const StatusBadge = ({ status }) => {
  const classes = getStatusClasses(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${classes.bg} ${classes.text} ${classes.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${classes.dot}`} />
      {status || 'Pendente'}
    </span>
  );
};

export default StatusBadge;
