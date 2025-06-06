import { ProductoResponse } from '../productos/producto-response';
import { SafeUrl } from '@angular/platform-browser';

/**
 * Interfaz que representa un producto dentro de un pedido
 * Utilizada para mostrar los detalles de cada línea del pedido
 */
export interface PedidoProducto {
    productoId: number;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    foto?: string;
    imagenUrl?: SafeUrl;
}

/**
 * Interfaz que representa la respuesta del servidor para un pedido
 * Incluye información del pedido, cliente y productos
 */
export interface PedidoResponse {
    id: number;
    usuario?: {
        nombre: string;
        apellidos: string
    };
    usuarioNombre?: string;
    fechaPedido: string;
    estado: string;
    total: number;
    lineasPedido: PedidoProducto[];
    expanded?: boolean;
}
