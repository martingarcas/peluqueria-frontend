import { Component, OnInit } from '@angular/core';
import { CitaService } from 'src/app/services/cita/cita.service';
import { CitaResponse } from 'src/app/models/citas/cita-response';

@Component({
  selector: 'app-lista-citas',
  templateUrl: './lista-citas.component.html',
  styleUrls: ['./lista-citas.component.css']
})
export class ListaCitasComponent implements OnInit {
  citas: CitaResponse[] = [];
  citasFiltradas: CitaResponse[] = [];
  searchTerm: string = '';
  mensajeError: string = '';
  mensajeExito: string = '';
  estadosPosibles: string[] = ['PROGRAMADA', 'COMPLETADA', 'CANCELADA'];

  constructor(private citaService: CitaService) {}

  ngOnInit(): void {
    this.cargarCitas();
  }

  cargarCitas(): void {
    this.citaService.obtenerCitas().subscribe({
      next: (response: any) => {
        if (response && response.citas && Array.isArray(response.citas.citas)) {
          this.citas = response.citas.citas;
          this.citasFiltradas = this.citas;
        } else {
          this.citas = [];
          this.citasFiltradas = [];
        }
      },
      error: (error) => {
        this.mostrarError('Error al cargar las citas');
      }
    });
  }

  onSearchChange(): void {
    if (!this.searchTerm) {
      this.citasFiltradas = this.citas;
      return;
    }
    const termino = this.searchTerm.toLowerCase();
    this.citasFiltradas = this.citas.filter(cita =>
      (cita.servicioNombre?.toLowerCase() || '').includes(termino) ||
      (cita.trabajadorNombre?.toLowerCase() || '').includes(termino) ||
      (cita.usuarioNombre?.toLowerCase() || '').includes(termino) ||
      (cita.fecha?.toLowerCase() || '').includes(termino) ||
      (cita.estado?.toLowerCase() || '').includes(termino)
    );
  }

  actualizarEstado(citaId: number, nuevoEstado: string): void {
    if (!citaId || !nuevoEstado) {
      this.mostrarError('Datos de cita inválidos');
      return;
    }
    this.citaService.actualizarEstadoCita(citaId, nuevoEstado).subscribe({
      next: () => {
        this.mostrarExito(`Cita ${nuevoEstado.toLowerCase()} correctamente`);
        this.cargarCitas();
      },
      error: (error) => {
        this.mostrarError(error.error?.mensaje || `Error al ${nuevoEstado.toLowerCase()} la cita`);
      }
    });
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mensajeError = '';
    setTimeout(() => this.limpiarMensajes(), 3000);
  }

  private mostrarError(mensaje: string): void {
    this.mensajeError = mensaje;
    this.mensajeExito = '';
    setTimeout(() => this.limpiarMensajes(), 3000);
  }

  private limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }
}
