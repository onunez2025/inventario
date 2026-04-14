export interface Articulo {
  id: string;
  sku: string;
  nombre: string;
  descripcion?: string;
  costo_unitario: number;
  stock_sistema: number;
  categoria?: string;
}

export interface Inventario {
  id: string;
  tienda_nombre: string;
  estado: 'abierto' | 'cerrado';
  fecha_inicio: string;
  fecha_fin?: string;
}

export interface Conteo {
  id: string;
  inventario_id: string;
  articulo_id: string;
  cantidad_fisica: number;
  usuario_id: string;
  observacion?: string;
  foto_url?: string;
  created_at: string;
}

export type UserRole = 'supervisor' | 'operario';

export interface Perfil {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  created_at?: string;
}

export interface ConciliacionRecord {
  articulo_id: string;
  sku: string;
  articulo_nombre: string;
  costo_unitario: number;
  stock_sistema: number;
  cantidad_fisica: number;
  diferencia_unidades: number;
  diferencia_valorizada: number;
  ultima_observacion?: string;
  ultima_foto?: string;
}
