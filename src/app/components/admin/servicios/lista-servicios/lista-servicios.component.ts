import { Component, OnInit, OnDestroy } from '@angular/core';
import { ServicioResponse } from 'src/app/models/servicios/servicio-response';
import { ServicioService } from 'src/app/services/servicio/servicio.service';

@Component({
  selector: 'app-lista-servicios',
  templateUrl: './lista-servicios.component.html',
  styleUrls: ['./lista-servicios.component.css']
})
export class ListaServiciosComponent implements OnInit {
  servicios: ServicioResponse[] = [];
  serviciosFiltrados: ServicioResponse[] = [];
  mensajeError: string = '';
  mensajeExito: string = '';
  searchTerm: string = '';

  // Propiedades para el modal de eliminación
  mostrarModalConfirmacion = false;
  servicioAEliminar: ServicioResponse | null = null;

  // Propiedades para el formulario
  mostrarFormulario = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  servicioEnEdicion: ServicioResponse | null = null;

  constructor(
    private servicioService: ServicioService,
  ) { }

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.servicioService.obtenerTodos().subscribe({
      next: (response) => {
        this.servicios = response.servicios;
        this.serviciosFiltrados = this.servicios;
      },
      error: (error) => {
        this.mostrarError(error.error?.mensaje || 'Error al cargar los servicios');
        console.error('Error:', error);
      }
    });
  }

  filtrarServicios(): void {
    if (!this.searchTerm) {
      this.serviciosFiltrados = this.servicios;
      return;
    }

    this.serviciosFiltrados = this.servicios.filter(servicio =>
      servicio.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      servicio.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Métodos para el formulario
  mostrarFormularioCrear(): void {
    this.modoFormulario = 'crear';
    this.servicioEnEdicion = null;
    this.mostrarFormulario = true;
  }

  mostrarFormularioEditar(servicio: ServicioResponse): void {
    this.modoFormulario = 'editar';
    this.servicioEnEdicion = servicio;
    this.mostrarFormulario = true;
  }

  volverALista(): void {
    this.mostrarFormulario = false;
    this.servicioEnEdicion = null;
  }

  guardarServicio(servicio: ServicioResponse): void {
    this.cargarServicios();
    this.volverALista();
    this.mostrarExito('Servicio guardado correctamente');
  }

  // Métodos para eliminación
  confirmarEliminacion(servicio: ServicioResponse): void {
    this.limpiarMensajes();
    this.servicioAEliminar = servicio;
    this.mostrarModalConfirmacion = true;
  }

  cancelarEliminacion(): void {
    this.mostrarModalConfirmacion = false;
    this.servicioAEliminar = null;
  }

  async eliminarServicio(): Promise<void> {
    if (!this.servicioAEliminar) return;

    try {
      const response = await this.servicioService.eliminar(
        this.servicioAEliminar.id
      ).toPromise();

      this.mostrarExito(response?.mensaje || 'Servicio eliminado correctamente');
      this.cargarServicios();

    } catch (error: any) {
      this.mostrarError(error.error?.mensaje || 'Error al eliminar el servicio');
      console.error('Error:', error);
    } finally {
      this.cancelarEliminacion();
    }
  }

  onSearchChange(): void {
    this.filtrarServicios();
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
