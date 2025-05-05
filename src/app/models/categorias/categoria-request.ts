import { ProductoRequest } from '../productos/producto-request';

export interface CategoriaRequest {
  nombre: string;
  descripcion: string;
  productosNuevos?: ProductoRequest[];
  productosExistentesIds?: number[];
  forzarMovimiento?: boolean;
}
