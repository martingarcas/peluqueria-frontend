import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PedidoService } from 'src/app/services/pedidos/pedidos.service';
import { ProductoService } from 'src/app/services/producto/producto.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface PedidoProducto {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  foto?: string;
}

interface PedidoResponse {
  id: number;
  usuario?: { nombre: string; apellidos: string };
  usuarioNombre?: string;
  fechaPedido: string;
  estado: string;
  total: number;
  lineasPedido: PedidoProducto[];
  expanded?: boolean;
}

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

  imagenesCache = new Map<string, SafeUrl>();
  imagenesProductoCache = new Map<number, SafeUrl>();

  constructor(
    private pedidoService: PedidoService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.pedidoService.obtenerTodosPedidos().subscribe({
      next: (response: { mensaje: string, pedidos: PedidoResponse[] }) => {
        console.log('Pedidos recibidos:', response.pedidos);
        this.pedidos = response.pedidos;
        this.pedidosFiltrados = this.pedidos;
      },
      error: (error: any) => {
        this.mensajeError = error.error?.mensaje || 'Error al cargar los pedidos';
      }
    });
  }

  onSearchChange(): void {
    if (!this.searchTerm && !this.estadoSeleccionado) {
      this.pedidosFiltrados = this.pedidos;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.pedidosFiltrados = this.pedidos.filter(p =>
      (!this.estadoSeleccionado || p.estado === this.estadoSeleccionado) &&
      (
        p.usuarioNombre?.toLowerCase().includes(term) ||
        p.estado.toLowerCase().includes(term) ||
        p.fechaPedido.toLowerCase().includes(term) ||
        p.total.toString().includes(term)
      )
    );
  }

  onEstadoChange(): void {
    this.onSearchChange();
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
    this.cdr.detectChanges();
  }

  getProductoImage(productoId: number): SafeUrl {
    if (!productoId) return 'assets/images/no-image.png';
    if (this.imagenesProductoCache.has(productoId)) {
      return this.imagenesProductoCache.get(productoId)!;
    }
    this.productoService.obtenerPorId(productoId).subscribe({
      next: (resp) => {
        const fotoPath = resp.producto?.foto;
        if (fotoPath) {
          this.productoService.obtenerImagen(fotoPath).subscribe({
            next: (blob: Blob) => {
              const objectUrl = URL.createObjectURL(blob);
              const safeUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
              this.imagenesProductoCache.set(productoId, safeUrl);
              this.cdr.detectChanges();
            },
            error: () => {
              this.imagenesProductoCache.set(productoId, 'assets/images/no-image.png');
            }
          });
        } else {
          this.imagenesProductoCache.set(productoId, 'assets/images/no-image.png');
        }
      },
      error: () => {
        this.imagenesProductoCache.set(productoId, 'assets/images/no-image.png');
      }
    });
    return 'assets/images/no-image.png';
  }
}
