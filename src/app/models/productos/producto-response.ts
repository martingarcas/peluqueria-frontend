export interface ProductoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId?: number;
  categoriaNombre?: string;
  foto?: string;
  fechaCreacion: string;
}
