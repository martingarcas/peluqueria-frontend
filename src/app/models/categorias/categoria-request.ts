export interface CategoriaRequest {
  nombre: string;
  descripcion: string;
  productosNuevos?: any[];
  productosExistentesIds?: number[];
  forzarMovimiento?: boolean;
}
