import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService } from 'src/app/services/usuario/usuario.service';
import { ServicioService } from 'src/app/services/servicio/servicio.service';
import { HorarioService } from 'src/app/services/horario/horario.service';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { UsuarioResponse } from 'src/app/models/usuarios/usuario-response';
import { UsuarioRequest } from 'src/app/models/usuarios/usuario-request';
import { ServicioResponse } from 'src/app/models/servicios/servicio-response';
import { HorarioResponse } from 'src/app/models/horarios/horario-response';
import { ContratoRequest } from 'src/app/models/usuarios/contrato-request';
import { ContratoResponse } from 'src/app/models/usuarios/contrato-response';

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
  mostrarNuevoContrato: boolean = false;
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
      contratoGroup?.get('fechaInicio')?.setValidators([Validators.required]);
      contratoGroup?.get('tipoContrato')?.setValidators([Validators.required]);
      this.mostrarFormularioContrato = true;
      this.mostrarFormularioServicios = true;
      this.mostrarFormularioHorarios = true;
    } else {
      contratoGroup?.get('fechaInicio')?.clearValidators();
      contratoGroup?.get('tipoContrato')?.clearValidators();
      contratoGroup?.get('fechaFin')?.clearValidators();
      this.mostrarFormularioContrato = false;
      this.mostrarFormularioServicios = false;
      this.mostrarFormularioHorarios = false;
    }
    contratoGroup?.updateValueAndValidity();
    this.cdr.detectChanges();
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

      // Si es trabajador, mostrar los formularios correspondientes
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

    // Cargar servicios y horarios después de determinar si es trabajador
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

    // Establecer el rol y mostrar secciones correspondientes
    this.esTrabajador = this.usuarioAEditar.role === 'trabajador';

    if (this.esTrabajador) {
      this.mostrarFormularioServicios = true;
      this.mostrarFormularioHorarios = true;

      // Inicializar los arrays de selección
      this.serviciosSeleccionados = this.usuarioAEditar.servicios?.map(s => s.id) || [];
      this.horariosSeleccionados = this.usuarioAEditar.horarios?.map(h => h.id) || [];

      // Verificar si se puede crear nuevo contrato
      this.mostrarNuevoContrato = !this.usuarioAEditar.contrato ||
                                 this.usuarioAEditar.contrato.estadoNombre === 'INACTIVO';

      // Si hay contrato activo o pendiente, ocultar el formulario de contrato
      if (this.usuarioAEditar.contrato &&
          ['ACTIVO', 'PENDIENTE'].includes(this.usuarioAEditar.contrato.estadoNombre)) {
        this.usuarioForm.get('contrato')?.disable();
      }
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
      this.marcarCamposComoTocados(this.usuarioForm);
      return;
    }

    // Validar que haya al menos un servicio y un horario seleccionado si es trabajador
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

    // Preparar datos del usuario
    const usuarioRequest = {
      nombre: usuarioData.nombre,
      apellidos: usuarioData.apellidos,
      email: usuarioData.email,
      password: usuarioData.password,
      telefono: usuarioData.telefono,
      direccion: usuarioData.direccion,
      // Solo incluir el rol en modo crear
      ...(this.modo === 'crear' && { role: usuarioData.role.toLowerCase() })
    };

    // Siempre incluir servicios y horarios si es trabajador (tanto en crear como en editar)
    if (this.esTrabajador) {
      Object.assign(usuarioRequest, {
        serviciosIds: this.serviciosSeleccionados,
        horariosIds: this.horariosSeleccionados
      });

      if (usuarioData.contrato) {
        Object.assign(usuarioRequest, {
          contrato: {
            fechaInicioContrato: usuarioData.contrato.fechaInicio,
            fechaFinContrato: usuarioData.contrato.fechaFin,
            tipoContrato: usuarioData.contrato.tipoContrato,
            salario: usuarioData.contrato.salario
          }
        });
      }
    }

    // Agregar el JSON del usuario
    formData.append('usuario', new Blob([JSON.stringify(usuarioRequest)], { type: 'application/json' }));

    // Agregar la foto si existe
    if (this.fotoSeleccionada) {
      formData.append('foto', this.fotoSeleccionada);
    }

    // Agregar el documento del contrato si existe
    if (this.contratoDocumento) {
      formData.append('documentoContrato', this.contratoDocumento);
    }

    try {
      let response;
      let contratoFile;

      // Generar el PDF pero no añadirlo al FormData todavía
      if (this.modo === 'crear' && this.esTrabajador) {
        contratoFile = await this.pdfService.generarContratoTrabajador({
          nombre: usuarioData.nombre,
          apellidos: usuarioData.apellidos,
          tipoContrato: usuarioData.contrato.tipoContrato,
          fechaInicioContrato: usuarioData.contrato.fechaInicio,
          fechaFinContrato: usuarioData.contrato.fechaFin,
          salario: usuarioData.contrato.salario
        }).toPromise();
      }

      if (this.modo === 'crear') {
        // Solo añadir el contrato al FormData si tenemos el archivo
        if (this.esTrabajador && contratoFile) {
          formData.append('documentoContrato', contratoFile);
        }
        response = await this.usuarioService.crear(formData).toPromise();
      } else {
        response = await this.usuarioService.actualizar(this.usuarioAEditar!.id, formData).toPromise();
      }

      if (response) {
        this.mostrarExito(response.mensaje);
        this.onGuardar.emit({ mensaje: response.mensaje, usuario: response.usuario });
      }
    } catch (error: any) {
      console.error('Error al guardar usuario:', {
        error: error,
        mensaje: error.error?.mensaje,
        respuesta: error.error
      });

      // Si hay errores específicos de validación, mostrarlos
      if (error.error?.errores) {
        const mensajesError = Object.values(error.error.errores);
        if (mensajesError.length > 0) {
          this.mostrarError(mensajesError.join('\n'));
          return;
        }
      }

      // Si no hay errores específicos, mostrar el mensaje general
      const mensajeError = error.error?.mensaje ||
                          'Error al guardar el usuario';
      this.mostrarError(mensajeError);
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
    // No usar timeout para errores de validación para que el usuario pueda leerlos
  }

  private limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  private marcarCamposComoTocados(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup) {
        this.marcarCamposComoTocados(control);
      }
      control.markAsTouched();
    });
  }
}
