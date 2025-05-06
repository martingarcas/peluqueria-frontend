import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HorarioResponse } from 'src/app/models/horarios/horario-response';
import { HorarioService } from 'src/app/services/horario/horario.service';

@Component({
  selector: 'app-lista-horarios',
  templateUrl: './lista-horarios.component.html',
  styleUrls: ['./lista-horarios.component.css']
})
export class ListaHorariosComponent implements OnInit, OnDestroy {
  horarios: HorarioResponse[] = [];
  horariosFiltrados: HorarioResponse[] = [];
  mensajeError: string = '';
  mensajeExito: string = '';
  searchTerm: string = '';

  // Propiedades para el modal de eliminación
  mostrarModalConfirmacion = false;
  horarioAEliminar: HorarioResponse | null = null;

  // Propiedades para el formulario
  mostrarFormulario = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  horarioEnEdicion: HorarioResponse | null = null;

  constructor(
    private horarioService: HorarioService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarHorarios();
  }

  ngOnDestroy(): void {
    // Limpieza si es necesaria
  }

  cargarHorarios(): void {
    this.horarioService.obtenerTodos().subscribe({
      next: (response) => {
        this.horarios = response.horarios;
        this.horariosFiltrados = this.horarios;
      },
      error: (error) => {
        this.mostrarError(error.error?.mensaje || 'Error al cargar los horarios');
        console.error('Error:', error);
      }
    });
  }

  filtrarHorarios(): void {
    if (!this.searchTerm) {
      this.horariosFiltrados = this.horarios;
      return;
    }

    this.horariosFiltrados = this.horarios.filter(horario =>
      horario.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      horario.diaSemana.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Métodos para el formulario
  mostrarFormularioCrear(): void {
    this.modoFormulario = 'crear';
    this.horarioEnEdicion = null;
    this.mostrarFormulario = true;
  }

  mostrarFormularioEditar(horario: HorarioResponse): void {
    this.modoFormulario = 'editar';
    this.horarioEnEdicion = horario;
    this.mostrarFormulario = true;
  }

  volverALista(): void {
    this.mostrarFormulario = false;
    this.horarioEnEdicion = null;
  }

  guardarHorario(horario: HorarioResponse): void {
    this.cargarHorarios();
    this.volverALista();
    this.mostrarExito('Horario guardado correctamente');
  }

  // Métodos para eliminación
  confirmarEliminacion(horario: HorarioResponse): void {
    this.limpiarMensajes();
    this.horarioAEliminar = horario;
    this.mostrarModalConfirmacion = true;
  }

  cancelarEliminacion(): void {
    this.mostrarModalConfirmacion = false;
    this.horarioAEliminar = null;
  }

  async eliminarHorario(): Promise<void> {
    if (!this.horarioAEliminar) return;

    try {
      const response = await this.horarioService.eliminar(
        this.horarioAEliminar.id
      ).toPromise();

      this.mostrarExito(response?.mensaje || 'Horario eliminado correctamente');
      this.cargarHorarios();

    } catch (error: any) {
      this.mostrarError(error.error?.mensaje || 'Error al eliminar el horario');
      console.error('Error:', error);
    } finally {
      this.cancelarEliminacion();
    }
  }

  onSearchChange(): void {
    this.filtrarHorarios();
  }

  formatDiaSemana(dia: string): string {
    return dia.charAt(0).toUpperCase() + dia.slice(1);
  }

  limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
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
}
