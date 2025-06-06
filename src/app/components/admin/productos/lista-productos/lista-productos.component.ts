// lista-productos.component.ts
import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ProductoResponse } from 'src/app/models/productos/producto-response';
import { ProductoService } from 'src/app/services/producto/producto.service';

@Component({
  selector: 'app-lista-productos',
  templateUrl: './lista-productos.component.html',
  styleUrls: ['./lista-productos.component.css']
})
export class ListaProductosComponent implements OnInit {
  productos: ProductoResponse[] = [];
  productosFiltrados: ProductoResponse[] = [];
  mensajeError: string = '';
  mensajeExito: string = '';
  searchTerm: string = '';

  // Propiedades para el modal de eliminación
  mostrarModalConfirmacion = false;
  productoAEliminar: ProductoResponse | null = null;

  // Propiedades para el formulario
  mostrarFormulario = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  productoEnEdicion: ProductoResponse | null = null;

  constructor(
    private productoService: ProductoService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.productoService.obtenerTodos().subscribe({
      next: (response) => {
        this.productos = response.productos;
        this.productosFiltrados = this.productos;
        this.cargarImagenesProductos();
      },
      error: (error) => {
        this.mostrarError(error.error?.mensaje || 'Error al cargar los productos');
      }
    });
  }

  cargarImagenesProductos(): void {
    this.productos.forEach(producto => {
      if (producto.foto) {
        this.productoService.obtenerImagen(producto.foto).subscribe({
          next: (blob: Blob) => {
            const objectUrl = URL.createObjectURL(blob);
            producto.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
          },
          error: () => {
            producto.imagenUrl = 'assets/images/no-image.png';
          }
        });
      } else {
        producto.imagenUrl = 'assets/images/no-image.png';
      }
    });
  }

  filtrarProductos(): void {
    if (!this.searchTerm) {
      this.productosFiltrados = this.productos;
      return;
    }

    this.productosFiltrados = this.productos.filter(producto =>
      producto.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      producto.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Métodos para el formulario
  mostrarFormularioCrear(): void {
    this.modoFormulario = 'crear';
    this.productoEnEdicion = null;
    this.mostrarFormulario = true;
  }

  mostrarFormularioEditar(producto: ProductoResponse): void {
    this.modoFormulario = 'editar';
    this.productoEnEdicion = producto;
    this.mostrarFormulario = true;
  }

  volverALista(): void {
    this.mostrarFormulario = false;
    this.productoEnEdicion = null;
  }

  guardarProducto(response: { mensaje: string, producto: ProductoResponse }): void {
    this.cargarProductos();
    this.volverALista();
    this.mostrarExito(response.mensaje);
  }

  // Métodos para eliminación
  confirmarEliminacion(producto: ProductoResponse): void {
    this.limpiarMensajes();
    this.productoAEliminar = producto;
    this.mostrarModalConfirmacion = true;
  }

  cancelarEliminacion(): void {
    this.mostrarModalConfirmacion = false;
    this.productoAEliminar = null;
  }

  async eliminarProducto(): Promise<void> {
    if (!this.productoAEliminar) return;

    try {
      const response = await this.productoService.eliminar(
        this.productoAEliminar.id
      ).toPromise();

      this.mostrarExito(response?.mensaje || 'Producto eliminado correctamente');
      this.cargarProductos();

    } catch (error: any) {
      this.mostrarError(error.error?.mensaje || 'Error al eliminar el producto');
    } finally {
      this.cancelarEliminacion();
    }
  }

  onSearchChange(): void {
    this.filtrarProductos();
  }

  private mostrarExito(mensaje: string): void {
    this.limpiarMensajes();
    this.mensajeExito = mensaje;
    setTimeout(() => this.mensajeExito = '', 3000);
  }

  private mostrarError(mensaje: string): void {
    this.limpiarMensajes();
    this.mensajeError = mensaje;
    setTimeout(() => this.mensajeError = '', 3000);
  }

  private limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
  }
}