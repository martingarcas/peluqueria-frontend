/**
 * Interfaz para la respuesta del carrito del backend
 * Se utiliza en el componente de carrito
 * Contiene el carrito serializado como string y el total
 */
export interface CarritoResponse {
  carrito: string;  // Array de productos serializado
  total: number;    // Total del carrito
  mensaje?: string;
}
