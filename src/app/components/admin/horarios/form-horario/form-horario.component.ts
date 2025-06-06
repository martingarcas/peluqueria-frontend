import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HorarioResponse } from 'src/app/models/horarios/horario-response';
import { HorarioRequest } from 'src/app/models/horarios/horario-request';
import { HorarioService } from 'src/app/services/horario/horario.service';

@Component({
  selector: 'app-form-horario',
  templateUrl: './form-horario.component.html',
  styleUrls: ['./form-horario.component.css']
})
export class FormHorarioComponent implements OnInit {
  @Input() horario: HorarioResponse | null = null;
  @Input() modo: 'crear' | 'editar' = 'crear';
  @Output() onGuardar = new EventEmitter<HorarioResponse>();
  @Output() onCancelar = new EventEmitter<void>();

  horarioForm: FormGroup;
  mensajeError: string = '';
  mensajeExito: string = '';
  diasSemana: string[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  constructor(
    private fb: FormBuilder,
    private horarioService: HorarioService
  ) {
    this.horarioForm = this.fb.group({
      nombre: ['', [Validators.required]],
      diaSemana: ['', [Validators.required]],
      horaInicio: ['', [Validators.required]],
      horaFin: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.modo === 'editar' && this.horario) {
      this.horarioForm.patchValue({
        nombre: this.horario.nombre,
        diaSemana: this.horario.diaSemana.toLowerCase(),
        horaInicio: this.horario.horaInicio.substring(0, 5),
        horaFin: this.horario.horaFin.substring(0, 5)
      });
    }
  }

  formatDiaSemana(dia: string): string {
    return dia.charAt(0).toUpperCase() + dia.slice(1);
  }

  private mostrarError(mensaje: string): void {
    this.mensajeError = mensaje;
    setTimeout(() => this.mensajeError = '', 3000);
  }

  onSubmit(): void {
    if (this.horarioForm.valid) {
      const formValues = this.horarioForm.value;
      const horarioData: HorarioRequest = {
        nombre: formValues.nombre,
        diaSemana: formValues.diaSemana.toLowerCase(),
        horaInicio: formValues.horaInicio + ':00',
        horaFin: formValues.horaFin + ':00'
      };

      const operacion = this.modo === 'crear'
        ? this.horarioService.crear(horarioData)
        : this.horarioService.actualizar(this.horario!.id, horarioData);

      operacion.subscribe({
        next: (response) => {
          this.mensajeExito = response.mensaje;
          setTimeout(() => {
            this.onGuardar.emit(response.horario);
          }, 1500);
        },
        error: (error) => {
          this.mostrarError(error.error?.mensaje || 'Error al guardar el horario');
          console.error('Error:', error);
        }
      });
    } else {
      this.mostrarError('Por favor, complete todos los campos requeridos');
    }
  }

  cancelar(): void {
    this.onCancelar.emit();
  }

  limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
  }
}
