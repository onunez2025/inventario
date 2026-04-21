export interface Articulo {
  id: string;
  sku: string;
  nombre: string;
  descripcion?: string;
  costo_unitario: number;
  stock_sistema: number;
  categoria?: string;
  marca?: string;
  tipo?: string;
}

export interface Inventario {
  id: string;
  tienda_nombre: string;
  estado: 'abierto' | 'cerrado';
  fecha_inicio: string;
  fecha_fin?: string;
}

export interface Zona {
  id: string;
  inventario_id: string;
  nombre: string;
  usuario_asignado_id?: string;
  estado: 'pendiente' | 'en_proceso' | 'completado';
  created_at: string;
}

export interface Conteo {
  id: string;
  inventario_id: string;
  zona_id?: string;
  articulo_id: string;
  cantidad_fisica: number;
  usuario_id: string;
  observacion?: string;
  foto_url?: string;
  created_at: string;
}


export type UserRole = 'supervisor' | 'operario' | 'administrador';

export interface Perfil {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  pin_seguridad?: string;
  created_at?: string;
}

export interface ConciliacionRecord {
  inventario_id: string;
  tienda_nombre: string;
  articulo_id: string;
  sku: string;
  articulo_nombre: string;
  categoria?: string;
  marca?: string;
  tipo?: string;
  costo_unitario: number;
  stock_sistema: number;
  cantidad_fisica: number;
  diferencia_unidades: number;
  diferencia_valorizada: number;
  ultima_observacion?: string;
  ultima_foto?: string;
}

export interface StockSistemaSesion {
  id: string;
  inventario_id: string;
  sku: string;
  stock_sistema: number;
  created_at: string;
}
export interface RolPermiso {
  id: string;
  rol: string;
  permiso: string;
}

export type PermissionKey = 
  | 'view_dashboard' 
  | 'view_master' 
  | 'view_users' 
  | 'view_inventory_sessions' 
  | 'edit_master' 
  | 'manage_users' 
  | 'scan_items';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
}
