import React from 'react';
import { UserManagement } from '../components/UserManagement';
import { useNavigate } from 'react-router-dom';
import { PermissionKey } from '../types';

interface UsersPageProps {
  permisos: PermissionKey[];
}

const UsersPage: React.FC<UsersPageProps> = ({ permisos }) => {
  const navigate = useNavigate();
  const hasPermission = (key: PermissionKey) => permisos.includes(key);

  return (
    <div className="flex-1 flex flex-col bg-surface">
      <header className="bg-primary-container p-4 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate('/')} className="text-sm font-bold text-blue-100 flex items-center gap-2 hover:text-white transition-colors">
            ← Volver
          </button>
          <h1 className="text-xl font-display font-black tracking-tight">Administración de Usuarios</h1>
          <div className="w-16"></div>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <UserManagement canManageRBAC={hasPermission('manage_users')} />
      </div>
    </div>
  );
};

export default UsersPage;
