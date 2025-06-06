import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { PedidoService } from 'src/app/services/pedidos/pedidos.service';
import { ProductoService } from 'src/app/services/producto/producto.service';
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

  constructor(
    private pedidoService: PedidoService,
    private sanitizer: DomSanitizer,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.pedidoService.obtenerMisPedidos().subscribe({
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
      pedido.lineasPedido.forEach(linea => {
        this.productoService.obtenerPorId(linea.productoId).subscribe({
          next: (response: { mensaje: string, producto: any }) => {
            if (response.producto?.foto) {
              this.productoService.obtenerImagen(response.producto.foto).subscribe({
                next: (blob: Blob) => {
                  const objectUrl = URL.createObjectURL(blob);
                  linea.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
                },
                error: (error: any) => {
                  console.error('Error al cargar imagen del producto:', error);
                  linea.imagenUrl = this.sanitizer.bypassSecurityTrustUrl('assets/images/no-image.png');
                }
              });
            } else {
              linea.imagenUrl = this.sanitizer.bypassSecurityTrustUrl('assets/images/no-image.png');
            }
          },
          error: (error: any) => {
            console.error('Error al obtener producto:', error);
            linea.imagenUrl = this.sanitizer.bypassSecurityTrustUrl('assets/images/no-image.png');
          }
        });
      });
    });
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
  }
}
