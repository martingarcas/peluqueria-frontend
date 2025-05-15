import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  esAdminOTrabajador: boolean = false;
  mostrarFormulario: boolean = false;

  constructor(
    private citaService: CitaService,
    private router: Router
  ) {
    // Obtener el rol del usuario del sessionStorage de forma segura
    try {
      const storedLogin = sessionStorage.getItem('LOGIN');
      if (storedLogin) {
        const loginData = JSON.parse(storedLogin);
        // Verificar que loginData y rol existan antes de usar
        this.esAdminOTrabajador = loginData && loginData.rol &&
          ['admin', 'trabajador'].includes(loginData.rol.toLowerCase());
      }
    } catch (error) {
      console.error('Error al obtener datos de sesión:', error);
      this.esAdminOTrabajador = false;
    }
  }

  ngOnInit(): void {
    this.cargarCitas();
  }

  cargarCitas(): void {
    this.citaService.obtenerCitasUsuario().subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor:', response);
        if (response && response.citas && Array.isArray(response.citas.citas)) {
          this.citas = response.citas.citas;
          this.citasFiltradas = this.citas;
          console.log('Citas cargadas:', this.citas);
        } else {
          this.citas = [];
          this.citasFiltradas = [];
          console.warn('No se recibieron citas en la respuesta o el formato es incorrecto');
        }
      },
      error: (error) => {
        console.error('Error completo:', error);
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
      next: (response) => {
        this.mostrarExito(`Cita ${nuevoEstado.toLowerCase()} correctamente`);
        this.cargarCitas();
      },
      error: (error) => {
        this.mostrarError(error.error?.mensaje || `Error al ${nuevoEstado.toLowerCase()} la cita`);
        console.error('Error:', error);
      }
    });
  }

  // Métodos para el manejo del formulario
  crearCita(): void {
    this.mostrarFormulario = true;
  }

  onFormularioCerrado(): void {
    this.mostrarFormulario = false;
    this.cargarCitas();
  }

  onCitaGuardada(event: any): void {
    this.mostrarExito(event.mensaje);
    this.mostrarFormulario = false;
    this.cargarCitas();
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
