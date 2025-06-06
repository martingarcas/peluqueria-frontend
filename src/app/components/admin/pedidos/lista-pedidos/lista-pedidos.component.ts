import { Component, OnInit } from '@angular/core';
import { PedidoService } from 'src/app/services/pedidos/pedidos.service';
import { ProductoService } from 'src/app/services/producto/producto.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { PedidoResponse } from 'src/app/models/pedidos/pedido.interface';

@Component({
  selector: 'app-lista-pedidos',
  templateUrl: './lista-pedidos.component.html',
  styleUrls: ['./lista-pedidos.component.css']
})
export class ListaPedidosComponent implements OnInit {
  pedidos: PedidoResponse[] = [];
  pedidosFiltrados: PedidoResponse[] = [];
  estadoSeleccionado: string = '';
  mensajeError: string = '';
  mensajeExito: string = '';
  searchTerm: string = '';
  pedidoExpandido: number | null = null;
  estadosPosibles: string[] = ['PENDIENTE', 'ACEPTADO', 'ENVIADO', 'COMPLETADO', 'CANCELADO'];

  constructor(
    private pedidoService: PedidoService,
    private sanitizer: DomSanitizer,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.pedidoService.obtenerTodosPedidos().subscribe({
      next: (response: { mensaje: string, pedidos: PedidoResponse[] }) => {
        this.pedidos = response.pedidos;
        this.pedidosFiltrados = this.pedidos;
        this.cargarImagenesProductos();
      },
      error: (error: any) => {
        this.mensajeError = error.error?.mensaje || 'Error al cargar los pedidos';
      }
    });
  }

  cargarImagenesProductos(): void {
    this.pedidos.forEach(pedido => {
      if (pedido.lineasPedido) {
        pedido.lineasPedido.forEach(linea => {
          if (linea.productoId) {
            this.productoService.obtenerPorId(linea.productoId).subscribe({
              next: (resp) => {
                if (resp.producto?.foto) {
                  this.productoService.obtenerImagen(resp.producto.foto).subscribe({
                    next: (blob: Blob) => {
                      const objectUrl = URL.createObjectURL(blob);
                      linea.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
                    },
                    error: () => {
                      linea.imagenUrl = 'assets/images/no-image.png';
                    }
                  });
                } else {
                  linea.imagenUrl = 'assets/images/no-image.png';
                }
              },
              error: () => {
                linea.imagenUrl = 'assets/images/no-image.png';
              }
            });
          }
        });
      }
    });
  }

  onSearchChange(): void {
    if (!this.searchTerm && !this.estadoSeleccionado) {
      this.pedidosFiltrados = this.pedidos;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.pedidosFiltrados = this.pedidos.filter(pedido =>
      (!this.estadoSeleccionado || pedido.estado === this.estadoSeleccionado) &&
      (
        pedido.usuarioNombre?.toLowerCase().includes(term) ||
        pedido.estado.toLowerCase().includes(term) ||
        pedido.fechaPedido.toLowerCase().includes(term) ||
        pedido.total.toString().includes(term)
      )
    );
  }

  actualizarEstadoPedido(pedido: PedidoResponse, nuevoEstado: string): void {
    if (pedido.estado === nuevoEstado) return;
    this.pedidoService.actualizarEstadoPedido(pedido.id, nuevoEstado).subscribe({
      next: (resp) => {
        this.mensajeExito = 'Estado actualizado correctamente';
        pedido.estado = nuevoEstado;
        setTimeout(() => this.mensajeExito = '', 2500);
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al actualizar el estado';
        setTimeout(() => this.mensajeError = '', 2500);
      }
    });
  }

  toggleDetalles(pedido: PedidoResponse): void {
    pedido.expanded = !pedido.expanded;
  }
}
