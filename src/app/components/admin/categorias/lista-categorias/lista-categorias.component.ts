import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { CategoriaResponse } from 'src/app/models/categorias/categoria-response';
import { CategoriaService } from 'src/app/services/categoria/categoria.service';
import { ProductoService } from 'src/app/services/producto/producto.service';

@Component({
  selector: 'app-lista-categorias',
  templateUrl: './lista-categorias.component.html',
  styleUrls: ['./lista-categorias.component.css']
})
export class ListaCategoriasComponent implements OnInit {
  categorias: CategoriaResponse[] = [];
  categoriasFiltradas: CategoriaResponse[] = [];
  mensajeError: string = '';
  mensajeExito: string = '';
  searchTerm: string = '';
  categoriasExpandidas: Set<number> = new Set();

  // Propiedades para el modal
  mostrarModalConfirmacion = false;
  categoriaAEliminar: CategoriaResponse | null = null;
  eliminarProductosAsociados = false;

  // Propiedades para el formulario
  mostrarFormulario = false;
  categoriaEnEdicion: CategoriaResponse | null = null;

  constructor(
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.categoriaService.obtenerTodas().subscribe({
      next: (response) => {
        this.categorias = response.categorias;
        this.categoriasFiltradas = this.categorias;
        this.cargarImagenesProductos();
      },
      error: (error) => {
        this.mostrarError(error.error?.mensaje || 'Error al cargar las categorías');
        console.error('Error:', error);
      }
    });
  }

  cargarImagenesProductos(): void {
    this.categorias.forEach(categoria => {
      if (categoria.productos) {
        categoria.productos.forEach(producto => {
          if (producto.foto) {
            this.productoService.obtenerImagen(producto.foto).subscribe({
              next: (blob: Blob) => {
                const objectUrl = URL.createObjectURL(blob);
                producto.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
              },
              error: (error) => {
                console.error('Error al cargar la imagen:', error);
                producto.imagenUrl = 'assets/images/no-image.png';
              }
            });
          } else {
            producto.imagenUrl = 'assets/images/no-image.png';
          }
        });
      }
    });
  }

  filtrarCategorias(): void {
    if (!this.searchTerm) {
      this.categoriasFiltradas = this.categorias;
      return;
    }

    this.categoriasFiltradas = this.categorias.filter(categoria =>
      categoria.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      categoria.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  crearCategoria(): void {
    this.categoriaEnEdicion = null;
    this.mostrarFormulario = true;
  }

  editarCategoria(categoria: CategoriaResponse): void {
    this.categoriaEnEdicion = categoria;
    this.mostrarFormulario = true;
  }

  confirmarEliminacion(categoria: CategoriaResponse): void {
    this.limpiarMensajes();
    this.eliminarProductosAsociados = false;
    this.categoriaAEliminar = categoria;
    this.mostrarModalConfirmacion = true;
  }

  cancelarEliminacion(): void {
    this.mostrarModalConfirmacion = false;
    this.categoriaAEliminar = null;
    this.eliminarProductosAsociados = false;
  }

  async eliminarCategoria(): Promise<void> {
    if (!this.categoriaAEliminar) return;

    try {
      const response = await this.categoriaService.eliminar(
        this.categoriaAEliminar.id,
        this.eliminarProductosAsociados
      ).toPromise();

      this.mostrarExito(response?.mensaje || 'Categoría eliminada correctamente');
      this.cargarCategorias();

    } catch (error: any) {
      this.mostrarError(error.error?.mensaje || 'Error al eliminar la categoría');
      console.error('Error:', error);
    } finally {
      this.cancelarEliminacion();
    }
  }

  // Método para observar cambios en el searchTerm
  onSearchChange(): void {
    this.filtrarCategorias();
  }

  // Métodos para el formulario
  onFormularioCerrado(): void {
    this.mostrarFormulario = false;
    this.categoriaEnEdicion = null;
    this.cargarCategorias();
  }

  onCategoriaGuardada(mensaje: string): void {
    this.mostrarExito(mensaje);
    this.mostrarFormulario = false;
    this.categoriaEnEdicion = null;
    this.cargarCategorias();
  }

  // Métodos para manejar mensajes
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

  toggleProductos(categoriaId: number): void {
    if (this.categoriasExpandidas.has(categoriaId)) {
      this.categoriasExpandidas.delete(categoriaId);
    } else {
      this.categoriasExpandidas.add(categoriaId);
    }
  }

  isExpanded(categoriaId: number): boolean {
    return this.categoriasExpandidas.has(categoriaId);
  }
}
