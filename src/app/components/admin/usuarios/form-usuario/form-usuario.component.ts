import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService } from 'src/app/services/usuario/usuario.service';
import { ServicioService } from 'src/app/services/servicio/servicio.service';
import { HorarioService } from 'src/app/services/horario/horario.service';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { UsuarioResponse, ContratoResponse } from 'src/app/models/usuarios/usuario-response';
import { UsuarioRequest } from 'src/app/models/usuarios/usuario-request';
import { ServicioResponse } from 'src/app/models/servicios/servicio-response';
import { HorarioResponse } from 'src/app/models/horarios/horario-response';

@Component({
  selector: 'app-form-usuario',
  templateUrl: './form-usuario.component.html',
  styleUrls: ['./form-usuario.component.css']
})
export class FormUsuarioComponent implements OnInit {
  @Input() modo: 'crear' | 'editar' = 'crear';
  @Input() usuarioAEditar: UsuarioResponse | null = null;
  @Output() onGuardar = new EventEmitter<{ mensaje: string, usuario: UsuarioResponse }>();
  @Output() onCancelar = new EventEmitter<void>();

  usuarioForm: FormGroup;
  mensajeError: string = '';
  mensajeExito: string = '';
  serviciosDisponibles: ServicioResponse[] = [];
  horariosDisponibles: HorarioResponse[] = [];
  serviciosSeleccionados: number[] = [];
  horariosSeleccionados: number[] = [];
  mostrarFormularioContrato: boolean = false;
  mostrarFormularioServicios: boolean = false;
  mostrarFormularioHorarios: boolean = false;
  esTrabajador: boolean = false;
  fotoSeleccionada: File | null = null;
  previewImagen: string | null = null;
  contratoDocumento: File | null = null;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private servicioService: ServicioService,
    private horarioService: HorarioService,
    private pdfService: PdfService,
    private cdr: ChangeDetectorRef
  ) {
    this.usuarioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellidos: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      rol: ['CLIENTE', Validators.required],
      contrato: this.fb.group({
        fechaInicio: ['', []],
        fechaFin: ['', []],
        tipoContrato: ['', []]
      })
    });

    // Escuchar cambios en el rol para mostrar/ocultar secciones adicionales
    this.usuarioForm.get('rol')?.valueChanges.subscribe(rol => {
      this.esTrabajador = rol === 'TRABAJADOR';
      if (this.esTrabajador) {
        this.usuarioForm.get('contrato.fechaInicio')?.setValidators([Validators.required]);
        this.usuarioForm.get('contrato.tipoContrato')?.setValidators([Validators.required]);
      } else {
        this.usuarioForm.get('contrato.fechaInicio')?.clearValidators();
        this.usuarioForm.get('contrato.tipoContrato')?.clearValidators();
        this.usuarioForm.get('contrato.fechaFin')?.clearValidators();
      }
      this.usuarioForm.get('contrato')?.updateValueAndValidity();
      this.cdr.detectChanges();
    });

    // Escuchar cambios en el tipo de contrato
    this.usuarioForm.get('contrato.tipoContrato')?.valueChanges.subscribe(tipo => {
      const fechaFinControl = this.usuarioForm.get('contrato.fechaFin');
      if (tipo === 'temporal') {
        fechaFinControl?.setValidators([Validators.required]);
      } else {
        fechaFinControl?.clearValidators();
        fechaFinControl?.setValue(null);
      }
      fechaFinControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    if (this.modo === 'editar' && this.usuarioAEditar) {
      this.cargarUsuario();
    }
    this.cargarServicios();
    this.cargarHorarios();
  }

  cargarUsuario(): void {
    if (!this.usuarioAEditar) return;

    this.usuarioForm.patchValue({
      nombre: this.usuarioAEditar.nombre,
      apellidos: this.usuarioAEditar.apellidos,
      email: this.usuarioAEditar.email,
      telefono: this.usuarioAEditar.telefono,
      rol: this.usuarioAEditar.role
    });

    if (this.usuarioAEditar.contrato) {
      this.usuarioForm.patchValue({
        contrato: {
          fechaInicio: this.usuarioAEditar.contrato.fechaInicio,
          fechaFin: this.usuarioAEditar.contrato.fechaFin,
          tipoContrato: this.usuarioAEditar.contrato.tipoContrato
        }
      });
      this.mostrarFormularioContrato = true;
    }

    if (this.usuarioAEditar.servicios) {
      this.serviciosSeleccionados = this.usuarioAEditar.servicios.map(s => s.id);
      this.mostrarFormularioServicios = true;
    }

    if (this.usuarioAEditar.horarios) {
      this.horariosSeleccionados = this.usuarioAEditar.horarios.map(h => h.id);
      this.mostrarFormularioHorarios = true;
    }

    // En modo edición, no requerimos la contraseña
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('password')?.updateValueAndValidity();
  }

  cargarServicios(): void {
    this.servicioService.obtenerTodos().subscribe({
      next: (response) => {
        this.serviciosDisponibles = response.servicios;
      },
      error: (error) => {
        this.mostrarError('Error al cargar los servicios disponibles');
        console.error('Error:', error);
      }
    });
  }

  cargarHorarios(): void {
    this.horarioService.obtenerTodos().subscribe({
      next: (response) => {
        this.horariosDisponibles = response.horarios;
      },
      error: (error) => {
        this.mostrarError('Error al cargar los horarios disponibles');
        console.error('Error:', error);
      }
    });
  }

  toggleSeleccionServicio(servicioId: number): void {
    const index = this.serviciosSeleccionados.indexOf(servicioId);
    if (index === -1) {
      this.serviciosSeleccionados.push(servicioId);
    } else {
      this.serviciosSeleccionados.splice(index, 1);
    }
  }

  toggleSeleccionHorario(horarioId: number): void {
    const index = this.horariosSeleccionados.indexOf(horarioId);
    if (index === -1) {
      this.horariosSeleccionados.push(horarioId);
    } else {
      this.horariosSeleccionados.splice(index, 1);
    }
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fotoSeleccionada = input.files[0];
      // Crear preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImagen = reader.result as string;
      };
      reader.readAsDataURL(this.fotoSeleccionada);
    }
  }

  onContratoDocumentoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.contratoDocumento = input.files[0];
    }
  }

  async onSubmit(): Promise<void> {
    if (this.usuarioForm.invalid) {
      Object.keys(this.usuarioForm.controls).forEach(key => {
        const control = this.usuarioForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    const usuarioRequest: UsuarioRequest = {
      nombre: this.usuarioForm.get('nombre')?.value,
      apellidos: this.usuarioForm.get('apellidos')?.value,
      email: this.usuarioForm.get('email')?.value,
      password: this.usuarioForm.get('password')?.value,
      telefono: this.usuarioForm.get('telefono')?.value,
      rol: this.usuarioForm.get('rol')?.value,
      foto: this.fotoSeleccionada || undefined
    };

    if (this.esTrabajador) {
      // Generar el PDF del contrato automáticamente
      try {
        const contratoFile = await this.pdfService.generarContratoLaboral({
          nombreEmpleado: usuarioRequest.nombre,
          apellidosEmpleado: usuarioRequest.apellidos,
          emailEmpleado: usuarioRequest.email,
          telefonoEmpleado: usuarioRequest.telefono,
          fechaInicio: this.usuarioForm.get('contrato.fechaInicio')?.value,
          fechaFin: this.usuarioForm.get('contrato.fechaFin')?.value,
          tipoContrato: this.usuarioForm.get('contrato.tipoContrato')?.value
        });

        usuarioRequest.contrato = {
          fechaInicio: this.usuarioForm.get('contrato.fechaInicio')?.value,
          fechaFin: this.usuarioForm.get('contrato.fechaFin')?.value,
          tipoContrato: this.usuarioForm.get('contrato.tipoContrato')?.value,
          documento: contratoFile
        };

        if (this.serviciosSeleccionados.length > 0) {
          usuarioRequest.serviciosIds = this.serviciosSeleccionados;
        }

        if (this.horariosSeleccionados.length > 0) {
          usuarioRequest.horariosIds = this.horariosSeleccionados;
        }
      } catch (error) {
        this.mostrarError('Error al generar el contrato PDF');
        console.error('Error:', error);
        return;
      }
    }

    if (this.modo === 'crear') {
      this.usuarioService.crear(usuarioRequest).subscribe({
        next: (response) => {
          this.onGuardar.emit(response);
        },
        error: (error) => {
          this.mostrarError(error.error?.mensaje || 'Error al crear el usuario');
          console.error('Error:', error);
        }
      });
    } else if (this.modo === 'editar' && this.usuarioAEditar) {
      this.usuarioService.actualizar(this.usuarioAEditar.id, usuarioRequest).subscribe({
        next: (response) => {
          this.onGuardar.emit(response);
        },
        error: (error) => {
          this.mostrarError(error.error?.mensaje || 'Error al actualizar el usuario');
          console.error('Error:', error);
        }
      });
    }
  }

  cancelar(): void {
    this.onCancelar.emit();
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
