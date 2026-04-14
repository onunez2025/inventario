import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Check, ChevronDown } from 'lucide-react';

interface SearchableSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowNew?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder = 'Seleccionar...',
  allowNew = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isNewOption = allowNew && searchTerm && !options.some(opt => opt.toLowerCase() === searchTerm.toLowerCase());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">{label}</label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-left hover:bg-gray-100 transition-colors active:scale-[0.99]"
      >
        <span className={value ? 'text-gray-800 font-medium' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[60] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              autoFocus
              className="bg-transparent border-none outline-none text-sm w-full py-1 h-8"
              placeholder="Buscar o agregar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isNewOption) {
                  onChange(searchTerm);
                  setIsOpen(false);
                  setSearchTerm('');
                }
              }}
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1 py-2">
            {filteredOptions.length === 0 && !isNewOption && (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No se encontraron resultados
              </div>
            )}
            
            {filteredOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-colors text-sm group"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                <span className="truncate">{opt}</span>
                {value === opt && <Check className="w-4 h-4 text-secondary group-hover:text-white" />}
              </button>
            ))}

            {isNewOption && (
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-secondary font-bold text-sm hover:bg-blue-50 transition-colors"
                onClick={() => {
                  onChange(searchTerm);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                <div className="w-6 h-6 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span>Agregar "{searchTerm}"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
