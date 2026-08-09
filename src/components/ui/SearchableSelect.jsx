import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function SearchableSelect({
  options, // array of { value, label, sublabel }
  value,
  onChange,
  placeholder = 'Selecione...',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(lowerSearch) || 
      (opt.sublabel && opt.sublabel.toLowerCase().includes(lowerSearch))
    );
  }, [options, search]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Hidden input for HTML5 validation if required */}
      {required && (
        <input 
          type="text" 
          required={required} 
          value={value || ''} 
          className="opacity-0 absolute -z-10 w-0 h-0" 
          onChange={() => {}} 
        />
      )}
      
      <div 
        className="input-field flex items-center justify-between cursor-pointer"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch('');
        }}
      >
        <div className={`truncate ${!selectedOption ? 'text-slate-500' : 'text-slate-200'}`}>
          {selectedOption ? (
            <div className="flex items-center gap-2">
              <span>{selectedOption.label}</span>
              {selectedOption.sublabel && <span className="text-xs text-slate-400 border-l border-slate-600 pl-2">{selectedOption.sublabel}</span>}
            </div>
          ) : placeholder}
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-slate-700 relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              autoFocus
              className="w-full bg-slate-900/50 text-slate-200 text-sm rounded-lg pl-8 pr-8 py-2 outline-none border border-transparent focus:border-violet-500/50"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSearch(''); }} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-slate-500">Nenhum resultado encontrado.</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                    opt.value === value 
                      ? 'bg-violet-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <div className="font-medium">{opt.label}</div>
                  {opt.sublabel && <div className={`text-xs mt-0.5 ${opt.value === value ? 'text-violet-200' : 'text-slate-400'}`}>{opt.sublabel}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
