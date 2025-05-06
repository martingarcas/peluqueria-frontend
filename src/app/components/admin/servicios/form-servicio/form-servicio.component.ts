import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServicioService } from 'src/app/services/servicio/servicio.service';
import { ServicioResponse } from 'src/app/models/servicios/servicio-response';
import { ServicioRequest } from 'src/app/models/servicios/servicio-request';

@Component({
  selector: 'app-form-servicio',
  templateUrl: './form-servicio.component.html',
  styleUrls: ['./form-servicio.component.css']
})
export class FormServicioComponent implements OnInit {
  @Input() modo: 'crear' | 'editar' = 'crear';
  @Input() servicioAEditar: ServicioResponse | null = null;
  @Output() onGuardar = new EventEmitter<ServicioResponse>();
  @Output() onCancelar = new EventEmitter<void>();

  servicioForm: FormGroup;
  mensajeError: string = '';
  mensajeExito: string = '';

  constructor(
    private fb: FormBuilder,
    private servicioService: ServicioService
  ) {
    this.servicioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      duracion: ['', [Validators.required, Validators.min(1)]],
      precio: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (this.modo === 'editar' && this.servicioAEditar) {
      this.cargarDatosServicio();
    }
  }

  cargarDatosServicio(): void {
    if (this.servicioAEditar) {
      this.servicioForm.patchValue({
        nombre: this.servicioAEditar.nombre,
        descripcion: this.servicioAEditar.descripcion,
        duracion: this.servicioAEditar.duracion,
        precio: this.servicioAEditar.precio
      });
    }
  }

  onSubmit(): void {
    if (this.servicioForm.invalid) {
      this.mostrarError('Por favor, complete todos los campos requeridos correctamente');
      return;
    }

    const servicioRequest: ServicioRequest = {
      nombre: this.servicioForm.get('nombre')?.value,
      descripcion: this.servicioForm.get('descripcion')?.value,
      duracion: this.servicioForm.get('duracion')?.value,
      precio: this.servicioForm.get('precio')?.value
    };

    if (this.modo === 'editar' && this.servicioAEditar) {
      this.servicioService.actualizar(this.servicioAEditar.id, servicioRequest).subscribe({
        next: (response) => {
          this.mostrarExito('Servicio actualizado correctamente');
          this.onGuardar.emit(response.servicio);
        },
        error: (error) => {
          this.mostrarError(error.error?.mensaje || 'Error al actualizar el servicio');
          console.error('Error:', error);
        }
      });
    } else {
      this.servicioService.crear(servicioRequest).subscribe({
        next: (response) => {
          this.mostrarExito('Servicio creado correctamente');
          this.onGuardar.emit(response.servicio);
        },
        error: (error) => {
          this.mostrarError(error.error?.mensaje || 'Error al crear el servicio');
          console.error('Error:', error);
        }
      });
    }
  }

  cancelar(): void {
    this.onCancelar.emit();
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeError = '';
    this.mensajeExito = mensaje;
    setTimeout(() => this.mensajeExito = '', 3000);
  }

  private mostrarError(mensaje: string): void {
    this.mensajeExito = '';
    this.mensajeError = mensaje;
    setTimeout(() => this.mensajeError = '', 3000);
  }
}
