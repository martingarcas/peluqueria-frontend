import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService } from 'src/app/services/usuario/usuario.service';
import { ServicioService } from 'src/app/services/servicio/servicio.service';
import { HorarioService } from 'src/app/services/horario/horario.service';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { UsuarioResponse } from 'src/app/models/usuarios/usuario-response';
import { ServicioResponse } from 'src/app/models/servicios/servicio-response';
import { HorarioResponse } from 'src/app/models/horarios/horario-response';
import { ContratoService } from 'src/app/services/contrato/contrato.service';

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

  usuarioForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    apellidos: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', []],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    direccion: ['', [Validators.minLength(5)]],
    role: ['CLIENTE', Validators.required],
    contrato: this.fb.group({
      fechaInicio: [''],
      fechaFin: [''],
      tipoContrato: [''],
      salario: [0, [Validators.required, Validators.min(0)]]
    })
  });

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

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private servicioService: ServicioService,
    private horarioService: HorarioService,
    private contratoService: ContratoService,
    private pdfService: PdfService
  ) {
    this.inicializarFormulario();
  }

  private inicializarFormulario(): void {
    this.usuarioForm.get('role')?.valueChanges.subscribe(role => {
      this.esTrabajador = role === 'trabajador';
      this.actualizarValidacionesTrabajador();
    });

    this.usuarioForm.get('contrato.tipoContrato')?.valueChanges.subscribe(tipo => {
      this.actualizarValidacionesContrato(tipo);
    });
  }

  private actualizarValidacionesTrabajador(): void {
    const contratoGroup = this.usuarioForm.get('contrato');
    if (this.esTrabajador) {
      if (this.modo === 'crear' || (this.modo === 'editar' && this.mostrarFormularioContrato)) {
        contratoGroup?.get('fechaInicio')?.setValidators([Validators.required]);
        contratoGroup?.get('tipoContrato')?.setValidators([Validators.required]);
        contratoGroup?.get('salario')?.setValidators([Validators.required, Validators.min(0)]);
      }
      this.mostrarFormularioServicios = true;
      this.mostrarFormularioHorarios = true;
    } else {
      contratoGroup?.get('fechaInicio')?.clearValidators();
      contratoGroup?.get('tipoContrato')?.clearValidators();
      contratoGroup?.get('fechaFin')?.clearValidators();
      contratoGroup?.get('salario')?.clearValidators();
      this.mostrarFormularioServicios = false;
      this.mostrarFormularioHorarios = false;
    }
    contratoGroup?.updateValueAndValidity();
  }

  private actualizarValidacionesContrato(tipo: string): void {
    const fechaFinControl = this.usuarioForm.get('contrato.fechaFin');
    if (tipo === 'temporal') {
      fechaFinControl?.setValidators([Validators.required]);
    } else {
      fechaFinControl?.clearValidators();
      fechaFinControl?.setValue(null);
    }
    fechaFinControl?.updateValueAndValidity();
  }

  ngOnInit(): void {
    if (this.modo === 'editar' && this.usuarioAEditar) {
      this.usuarioForm.get('password')?.setValidators([
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]);

      this.esTrabajador = this.usuarioAEditar.role === 'trabajador';
      if (this.esTrabajador) {
        this.mostrarFormularioServicios = true;
        this.mostrarFormularioHorarios = true;
      }
    } else {
      this.usuarioForm.get('password')?.setValidators([
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]);
    }
    this.usuarioForm.get('password')?.updateValueAndValidity();

    if (this.modo === 'editar' && this.usuarioAEditar) {
      this.cargarUsuario();
    } else if (this.modo === 'crear') {
      this.usuarioForm.get('role')?.setValidators([Validators.required]);
      this.usuarioForm.get('role')?.updateValueAndValidity();
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
      direccion: this.usuarioAEditar.direccion
    });

    this.esTrabajador = this.usuarioAEditar.role === 'trabajador';

    if (this.esTrabajador) {
      this.mostrarFormularioServicios = true;
      this.mostrarFormularioHorarios = true;

      if (this.usuarioAEditar.servicios) {
        this.serviciosSeleccionados = this.usuarioAEditar.servicios.map(s => s.id);
      }

      if (this.usuarioAEditar.horarios) {
        this.horariosSeleccionados = this.usuarioAEditar.horarios.map(h => h.id);
      }

      this.contratoService.obtenerPorUsuarioId(this.usuarioAEditar.id).subscribe({
        next: (response) => {
          if (response.contratos && response.contratos.length > 0) {
            const contratoActual = response.contratos[0];
            if (this.usuarioAEditar) {
              this.usuarioAEditar.contrato = contratoActual;
            }

            this.mostrarFormularioContrato = false;

            if (['ACTIVO', 'PENDIENTE'].includes(contratoActual.estadoNombre)) {
              this.usuarioForm.get('contrato')?.disable();
            } else {
              this.usuarioForm.get('contrato')?.enable();
            }
          }
        },
        error: (error: { error?: { mensaje?: string } }) => {
          this.mostrarError(error.error?.mensaje || 'Error al cargar el contrato del usuario');
        }
      });
    }

    if (this.usuarioAEditar.foto) {
      this.previewImagen = `http://localhost:9000${this.usuarioAEditar.foto}`;
    }
  }

  cargarServicios(): void {
    this.servicioService.obtenerTodos().subscribe({
      next: (response) => {
        this.serviciosDisponibles = response.servicios;
      },
      error: (error: { error?: { mensaje?: string } }) => {
        this.mostrarError(error.error?.mensaje || 'Error al cargar los servicios disponibles');
      }
    });
  }

  cargarHorarios(): void {
    this.horarioService.obtenerTodos().subscribe({
      next: (response) => {
        this.horariosDisponibles = response.horarios;
      },
      error: (error: { error?: { mensaje?: string } }) => {
        this.mostrarError(error.error?.mensaje || 'Error al cargar los horarios disponibles');
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
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImagen = reader.result as string;
      };
      reader.readAsDataURL(this.fotoSeleccionada);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    if (this.esTrabajador) {
      if (this.serviciosSeleccionados.length === 0) {
        this.mostrarError('Debe seleccionar al menos un servicio');
        return;
      }
      if (this.horariosSeleccionados.length === 0) {
        this.mostrarError('Debe seleccionar al menos un horario');
        return;
      }
    }

    this.limpiarMensajes();
    const usuarioData = this.usuarioForm.value;

    if (this.modo === 'editar' && (!usuarioData.password || usuarioData.password.trim() === '')) {
      delete usuarioData.password;
    }

    const formData = new FormData();

    const usuarioRequest = {
      nombre: usuarioData.nombre,
      apellidos: usuarioData.apellidos,
      email: usuarioData.email,
      password: usuarioData.password,
      telefono: usuarioData.telefono,
      direccion: usuarioData.direccion,
      role: this.esTrabajador ? 'trabajador' : 'cliente',
      ...(this.esTrabajador && {
        serviciosIds: this.serviciosSeleccionados,
        horariosIds: this.horariosSeleccionados,
        contrato: this.esTrabajador && usuarioData.contrato ? {
          fechaInicioContrato: usuarioData.contrato.fechaInicio,
          fechaFinContrato: usuarioData.contrato.fechaFin || null,
          tipoContrato: usuarioData.contrato.tipoContrato,
          salario: usuarioData.contrato.salario
        } : null
      })
    };

    formData.append('usuario', new Blob([JSON.stringify(usuarioRequest)], { type: 'application/json' }));

    if (this.fotoSeleccionada) {
      formData.append('foto', this.fotoSeleccionada);
    }

    try {
      let response;
      let contratoFile;

      if (this.esTrabajador && usuarioData.contrato &&
        (this.modo === 'crear' || (this.modo === 'editar' && this.mostrarFormularioContrato))) {
        contratoFile = await this.pdfService.generarContratoTrabajador({
          nombre: usuarioData.nombre,
          apellidos: usuarioData.apellidos,
          tipoContrato: usuarioData.contrato.tipoContrato,
          fechaInicioContrato: usuarioData.contrato.fechaInicio,
          fechaFinContrato: usuarioData.contrato.fechaFin,
          salario: usuarioData.contrato.salario
        }).toPromise();

        if (contratoFile) {
          formData.append('documentoContrato', contratoFile, 'contrato.pdf');
        }
      }

      if (this.modo === 'crear') {
        response = await this.usuarioService.crear(formData).toPromise();
      } else {
        response = await this.usuarioService.actualizar(this.usuarioAEditar!.id, formData).toPromise();
      }

      if (response) {
        this.mostrarExito(response.mensaje);
        this.onGuardar.emit({ mensaje: response.mensaje, usuario: response.usuario });
      }
    } catch (error: unknown) {
      const errorObj = error as { error?: { mensaje?: string, errores?: string[] } };

      if (errorObj.error?.errores) {
        const mensajesError = Object.values(errorObj.error.errores);
        if (mensajesError.length > 0) {
          this.mostrarError(mensajesError.join('\n'));
          return;
        }
      }

      this.mostrarError(errorObj.error?.mensaje || 'Error al guardar el usuario');
    }
  }

  cancelar(): void {
    this.onCancelar.emit();
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mensajeError = '';
    setTimeout(() => this.mensajeExito = '', 3000);
  }

  private mostrarError(mensaje: string): void {
    this.mensajeError = mensaje;
    this.mensajeExito = '';
  }

  private limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
  }
}
