import { Component, OnInit } from '@angular/core';
import { ServicioService } from 'src/app/services/servicio/servicio.service';
import { ServicioResponse } from 'src/app/models/servicios/servicio-response';

@Component({
  selector: 'app-client-lista-servicios',
  templateUrl: './lista-servicios.component.html',
  styleUrls: ['./lista-servicios.component.css']
})
export class ListaServiciosComponent implements OnInit {
  servicios: ServicioResponse[] = [];
  mensajeError: string = '';

  iconosServicios: { [nombre: string]: string } = {
    'Corte clásico': 'assets/images/corteclasico.png',
    'Lavado y peinado': 'assets/images/lavadopeinado.png',
    'Coloración': 'assets/images/coloracion.png',
    'Manicura': 'assets/images/manicura.png',
    'Barbería completa': 'assets/images/barberia.png',
    'Tratamiento capilar': 'assets/images/tratamientocapilar.png'
  };

  constructor(private servicioService: ServicioService) { }

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.servicioService.obtenerTodos().subscribe({
      next: (response) => {
        this.servicios = response.servicios;
      },
      error: (error) => {
        this.mensajeError = error.error?.mensaje || 'Error al cargar los servicios';
      }
    });
  }

  getIcono(servicio: ServicioResponse): string {
    return this.iconosServicios[servicio.nombre] || 'assets/images/no-image.png';
  }
}
