import { supabase } from '../lib/supabase';
import type { PermissionKey, PermissionDefinition, RolPermiso } from '../types';

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  { 
    key: 'view_dashboard', 
    label: 'Ver Dashboard', 
    description: 'Permite visualizar los indicadores de progreso y KPIs financieros.' 
  },
  { 
    key: 'view_master', 
    label: 'Ver Maestro Artículos', 
    description: 'Permite acceder al catálogo maestro de productos.' 
  },
  { 
    key: 'edit_master', 
    label: 'Editar Maestro', 
    description: 'Permite crear o modificar datos de productos en el catálogo.' 
  },
  { 
    key: 'view_inventory_sessions', 
    label: 'Programar Inventarios', 
    description: 'Permite crear y gestionar sesiones de inventario.' 
  },
  { 
    key: 'view_users', 
    label: 'Gestionar Usuarios', 
    description: 'Permite administrar cuentas de usuarios y sus roles.' 
  },
  { 
    key: 'manage_users', 
    label: 'Editar Permisos (RBAC)', 
    description: 'Permite modificar la matriz de facultades por cada rol.' 
  },
  { 
    key: 'scan_items', 
    label: 'Escanear / Contar', 
    description: 'Permite realizar la toma física de inventario mediante escaneo.' 
  }
];

export const rbacService = {
  async getPermissionsByRole(rol: string): Promise<PermissionKey[]> {
    const { data, error } = await supabase
      .from('rol_permisos')
      .select('permiso')
      .eq('rol', rol);

    if (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }

    return (data || []).map(p => p.permiso as PermissionKey);
  },

  async updateRolePermission(rol: string, permiso: PermissionKey, granted: boolean) {
    if (granted) {
      const { error } = await supabase
        .from('rol_permisos')
        .upsert({ rol, permiso }, { onConflict: 'rol,permiso' });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('rol_permisos')
        .delete()
        .match({ rol, permiso });
      if (error) throw error;
    }
  },

  async getAllRolePermissions(): Promise<RolPermiso[]> {
    const { data, error } = await supabase
      .from('rol_permisos')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }
};
