// src/app/components/admin/productos/lista-productos/lista-productos.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ProductoResponse } from 'src/app/models/productos/producto-response';
import { ProductoService } from 'src/app/services/producto/producto.service';
import { SecurityContext } from '@angular/core';

@Component({
  selector: 'app-lista-productos',
  templateUrl: './lista-productos.component.html',
  styleUrls: ['./lista-productos.component.css']
})
export class ListaProductosComponent implements OnInit, OnDestroy {
  productos: ProductoResponse[] = [];
  productosFiltrados: ProductoResponse[] = [];
  mensajeError: string = '';
  mensajeExito: string = '';
  searchTerm: string = ' ';

  // Propiedades para el modal
  mostrarModalConfirmacion = false;
  productoAEliminar: ProductoResponse | null = null;

  // Cache de imágenes
  imagenesCache = new Map<string, SafeUrl>();

  constructor(
    private productoService: ProductoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngOnDestroy(): void {
    // Limpiar las URLs de las imágenes cacheadas
    this.imagenesCache.forEach((safeUrl) => {
      const url = this.sanitizer.sanitize(SecurityContext.URL, safeUrl);
      if (url) URL.revokeObjectURL(url);
    });
  }

  cargarProductos(): void {
    this.productoService.obtenerTodos().subscribe({
      next: (response) => {
        this.productos = response.productos;
        this.productosFiltrados = this.productos;
      },
      error: (error) => {
        this.mostrarError(error.error?.mensaje || 'Error al cargar los productos');
        console.error('Error:', error);
      }
    });
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

  crearProducto(): void {
    this.router.navigate(['/admin/productos/crear']);
  }

  editarProducto(producto: ProductoResponse): void {
    this.router.navigate([`/admin/productos/editar/${producto.id}`]);
  }

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
      console.error('Error:', error);
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