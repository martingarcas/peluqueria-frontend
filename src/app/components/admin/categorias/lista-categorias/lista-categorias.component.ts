import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoriaResponse } from 'src/app/models/categorias/categoria-response';
import { CategoriaService } from 'src/app/services/categoria/categoria.service';

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

  // Propiedades para el modal
  mostrarModalConfirmacion = false;
  categoriaAEliminar: CategoriaResponse | null = null;
  eliminarProductosAsociados = false;

  constructor(
    private categoriaService: CategoriaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.categoriaService.obtenerTodas().subscribe({
      next: (response) => {
        this.categorias = response.categorias;
        this.categoriasFiltradas = this.categorias;
      },
      error: (error) => {
        this.mostrarError(error.error?.mensaje || 'Error al cargar las categorías');
        console.error('Error:', error);
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
    this.router.navigate(['/admin/categorias/crear']);
  }

  editarCategoria(categoria: CategoriaResponse): void {
    this.router.navigate([`/admin/categorias/editar/${categoria.id}`]);
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
}