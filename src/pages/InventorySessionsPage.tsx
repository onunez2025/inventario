import React from 'react';
import { InventorySessions } from '../components/InventorySessions';
import { useNavigate } from 'react-router-dom';
import { Inventario } from '../types';

interface InventorySessionsPageProps {
  activeInventory: Inventario | null;
  onSelectInventory: (inv: Inventario) => void;
}

const InventorySessionsPage: React.FC<InventorySessionsPageProps> = ({ activeInventory, onSelectInventory }) => {
  const navigate = useNavigate();

  const handleSelect = (inv: Inventario) => {
    onSelectInventory(inv);
    navigate('/');
  };

  return (
    <div className="flex-1 flex flex-col bg-surface">
      <header className="bg-primary-container p-4 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate('/')} className="text-sm font-bold text-blue-100 flex items-center gap-2 hover:text-white transition-colors">
            ← Volver
          </button>
          <h1 className="text-xl font-display font-black tracking-tight">Sesiones de Inventario</h1>
          <div className="w-16"></div>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <InventorySessions 
          activeInventoryId={activeInventory?.id || null} 
          onSelectInventory={handleSelect} 
        />
      </div>
    </div>
  );
};

export default InventorySessionsPage;
