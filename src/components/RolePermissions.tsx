import React, { useState, useEffect } from 'react';
import { rbacService, ALL_PERMISSIONS } from '../services/rbacService';
import type { PermissionKey, UserRole } from '../types';
import { 
  Shield, 
  Info, 
  Lock,
  Unlock,
  Users,
  User,
  ShieldCheck
} from 'lucide-react';

interface RolePermissionsProps {
  canEdit?: boolean;
}

export const RolePermissions: React.FC<RolePermissionsProps> = ({ canEdit = true }) => {

  const [selectedRole, setSelectedRole] = useState<UserRole>('administrador');
  const [rolePerms, setRolePerms] = useState<PermissionKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const roles: UserRole[] = ['administrador', 'supervisor', 'operario'];

  useEffect(() => {
    fetchPermissions();
  }, [selectedRole]);

  const fetchPermissions = async () => {
    setLoading(true);
    const perms = await rbacService.getPermissionsByRole(selectedRole);
    setRolePerms(perms);
    setLoading(false);
  };

  const handleToggle = async (permiso: PermissionKey) => {
    const isGranted = rolePerms.includes(permiso);
    setSaving(permiso);
    try {
      await rbacService.updateRolePermission(selectedRole, permiso, !isGranted);
      if (isGranted) {
        setRolePerms(rolePerms.filter(p => p !== permiso));
      } else {
        setRolePerms([...rolePerms, permiso]);
      }
    } catch (err) {
      console.error('Error updating permission:', err);
      alert('Error al actualizar el permiso');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
      <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gray-50/30">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Shield className="text-primary" size={24} />
          </div>
          <div>
            <h4 className="text-xl font-display font-black tracking-tight text-gray-800">Matriz de Facultades</h4>
            <p className="text-sm text-gray-500 font-medium">Configura qué puede hacer cada nivel de acceso</p>
          </div>
        </div>

        <div className="flex bg-gray-100/50 p-1 rounded-2xl border border-gray-100 shadow-inner w-full sm:w-auto">
          {roles.map(rol => {
            const isActive = selectedRole === rol;
            return (
              <button
                key={rol}
                onClick={() => setSelectedRole(rol)}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all group ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02] z-10' 
                    : 'text-gray-400 hover:text-primary hover:bg-white transition-all'
                }`}
              >
                {rol === 'administrador' && <ShieldCheck size={16} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary'} />}
                {rol === 'supervisor' && <Users size={16} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary'} />}
                {rol === 'operario' && <User size={16} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary'} />}
                <span className="hidden xs:inline">{rol}</span>
                <span className="xs:hidden">{rol.charAt(0)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {ALL_PERMISSIONS.map((def) => {
          const isGranted = rolePerms.includes(def.key);
          const isProcessing = saving === def.key;

          return (
            <div key={def.key} className="p-6 flex items-start justify-between gap-6 hover:bg-gray-50/50 transition-colors group">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${isGranted ? 'text-gray-800' : 'text-gray-400'}`}>
                    {def.label}
                  </span>
                  {selectedRole === 'administrador' && def.key === 'manage_users' && (
                    <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Crítico</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  {def.description}
                </p>
              </div>

              <button
                onClick={() => handleToggle(def.key)}
                disabled={loading || isProcessing || !canEdit || (selectedRole === 'administrador' && def.key === 'manage_users')}

                className={`flex-shrink-0 relative w-14 h-8 rounded-full transition-all duration-300 ${isGranted ? 'bg-primary shadow-inner' : 'bg-gray-200'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
              >
                <div 
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300 ${isGranted ? 'translate-x-6' : 'translate-x-0'}`}
                >
                  {isProcessing ? (
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : isGranted ? (
                    <Unlock size={12} className="text-primary" />
                  ) : (
                    <Lock size={12} className="text-gray-300" />
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-6 bg-amber-50/50 border-t border-amber-100/50 flex items-start gap-4">
        <div className="p-2 bg-amber-100 rounded-xl">
          <Info className="text-amber-600" size={18} />
        </div>
        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
          <strong>Aviso de Seguridad:</strong> Los cambios en esta matriz se aplican de forma inmediata a todos los usuarios que posean el rol seleccionado. El permiso de "Editar Permisos (RBAC)" para el Administrador es obligatorio y no puede ser removido para evitar bloqueos del sistema.
        </p>
      </div>
    </div>
  );
};
