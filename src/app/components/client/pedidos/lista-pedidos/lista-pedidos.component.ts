import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { PedidoService } from 'src/app/services/pedidos/pedidos.service';
import { ProductoService } from 'src/app/services/producto/producto.service';

interface PedidoProducto {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  foto?: string;
}

interface PedidoResponse {
  id: number;
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
export class ListaPedidosComponent implements OnInit, OnDestroy {
  pedidos: PedidoResponse[] = [];
  pedidosFiltrados: PedidoResponse[] = [];
  estadoSeleccionado: string = '';
  mensajeError: string = '';
  mensajeExito: string = '';
  searchTerm: string = '';
  pedidoExpandido: number | null = null;

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

  ngOnDestroy(): void {
    this.imagenesCache.forEach((safeUrl) => {
      const url = this.sanitizer.sanitize(SecurityContext.URL, safeUrl);
      if (url) URL.revokeObjectURL(url);
    });
  }

  cargarPedidos(): void {
    this.pedidoService.obtenerMisPedidos().subscribe({
      next: (response: { mensaje: string, pedidos: PedidoResponse[] }) => {
        this.pedidos = response.pedidos;
        this.pedidosFiltrados = this.pedidos;
      },
      error: (error: any) => {
        this.mensajeError = error.error?.mensaje || 'Error al cargar los pedidos';
      }
    });
  }

  onSearchChange(): void {
    if (!this.searchTerm) {
      this.pedidosFiltrados = this.pedidos;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.pedidosFiltrados = this.pedidos.filter(p =>
      p.estado.toLowerCase().includes(term) ||
      p.fechaPedido.toLowerCase().includes(term) ||
      p.total.toString().includes(term)
    );
  }

  onEstadoChange(): void {
    if (!this.estadoSeleccionado) {
      this.pedidosFiltrados = this.pedidos;
      return;
    }

    this.pedidosFiltrados = this.pedidos.filter(pedido =>
      pedido.estado.toUpperCase() === this.estadoSeleccionado.toUpperCase()
    );
  }

  toggleDetalles(pedido: PedidoResponse): void {
    pedido.expanded = !pedido.expanded;
    this.cdr.detectChanges();
  }

  getImageUrl(fotoPath: string | undefined): SafeUrl {
    if (!fotoPath) return 'assets/images/no-image.png';

    if (this.imagenesCache.has(fotoPath)) {
      return this.imagenesCache.get(fotoPath)!;
    }

    this.productoService.obtenerImagen(fotoPath).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.imagenesCache.set(fotoPath, safeUrl);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar la imagen:', error);
        this.imagenesCache.set(fotoPath, 'assets/images/no-image.png');
      }
    });

    return 'assets/images/no-image.png';
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
