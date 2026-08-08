import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const DataTable = ({
  columns,
  data,
  searchPlaceholder = 'Buscar...',
  searchKeys = [],
  actions,
  emptyMessage = 'Nenhum registro encontrado.',
  pageSize = 10,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const s = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const val = key.split('.').reduce((o, k) => (o || {})[k], row);
        return String(val || '').toLowerCase().includes(s);
      })
    );
  }, [data, search, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="animate-fade-in">
      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder={searchPlaceholder}
          className="input-field pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left table-header ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right table-header">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={row.id || i} className="table-row">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-slate-300 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
          <span>
            {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 bg-slate-800 rounded-lg text-slate-200 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
