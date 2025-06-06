import { ProductoResponse } from '../productos/producto-response';

/**
 * Interfaz que representa un producto dentro de un pedido con su información completa
 * Utilizada para mostrar los detalles de cada línea del pedido
 */
export interface PedidoProducto {
    id: number;
    cantidad: number;
    precioUnitario: number;
    producto: ProductoResponse;
}

/**
 * Interfaz que representa la respuesta del servidor para un pedido
 * Incluye información completa del pedido y sus productos
 */
export interface PedidoResponse {
    id: number;
    fechaPedido: string;
    estado: string;
    total: number;
    lineasPedido: PedidoProducto[];
    expanded?: boolean;
}
