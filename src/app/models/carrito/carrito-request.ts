/**
 * Interfaz para actualizar el carrito de compras
 * Se utiliza en el componente de carrito y lista de productos
 * Representa un producto en el carrito con su cantidad
 */
export interface CarritoRequest {
  productoId: number;
  cantidad: number;
}
