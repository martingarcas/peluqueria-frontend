export interface ProductoRequest {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId?: number;
  foto?: File;
}
