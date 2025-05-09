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
  mostrarNuevoContrato: boolean = false;
  fotoSeleccionada: File | null = null;
  previewImagen: string | null = null;
  contratoDocumento: File | null = null;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private servicioService: ServicioService,
    private horarioService: HorarioService,
    private contratoService: ContratoService,
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

    console.log('Cargando usuario para editar:', this.usuarioAEditar);

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
      if (this.usuarioAEditar.servicios) {
        this.serviciosSeleccionados = this.usuarioAEditar.servicios.map(s => s.id);
        console.log('Servicios iniciales cargados:', this.serviciosSeleccionados);
      }

      if (this.usuarioAEditar.horarios) {
        this.horariosSeleccionados = this.usuarioAEditar.horarios.map(h => h.id);
        console.log('Horarios iniciales cargados:', this.horariosSeleccionados);
      }

      // Cargar el contrato del usuario
      this.contratoService.obtenerPorUsuarioId(this.usuarioAEditar.id).subscribe({
        next: (response) => {
          if (response.contratos && response.contratos.length > 0) {
            // Tomamos el contrato más reciente
            const contratoActual = response.contratos[0];
            if (this.usuarioAEditar) {
              this.usuarioAEditar.contrato = contratoActual;
            }

            // En modo edición, el formulario de contrato está oculto por defecto
            this.mostrarFormularioContrato = false;

            // Si hay contrato activo o pendiente, deshabilitar el grupo de contrato
            if (['ACTIVO', 'PENDIENTE'].includes(contratoActual.estadoNombre)) {
              this.usuarioForm.get('contrato')?.disable();
            } else {
              // Si está inactivo, habilitar el grupo pero mantenerlo oculto
              this.usuarioForm.get('contrato')?.enable();
            }
          }
        },
        error: (error) => {
          console.error('Error al cargar el contrato:', error);
          this.mostrarError('Error al cargar el contrato del usuario');
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
    console.log('Servicios seleccionados:', this.serviciosSeleccionados);
  }

  toggleSeleccionHorario(horarioId: number): void {
    const index = this.horariosSeleccionados.indexOf(horarioId);
    if (index === -1) {
      this.horariosSeleccionados.push(horarioId);
    } else {
      this.horariosSeleccionados.splice(index, 1);
    }
    console.log('Horarios seleccionados:', this.horariosSeleccionados);
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
      console.log('Es trabajador, verificando selecciones...');
      console.log('Servicios seleccionados antes de enviar:', this.serviciosSeleccionados);
      console.log('Horarios seleccionados antes de enviar:', this.horariosSeleccionados);

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
    console.log('Datos del formulario:', usuarioData);

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
      // Incluir servicios y horarios en el objeto usuario si es trabajador
      ...(this.esTrabajador && {
        serviciosIds: this.serviciosSeleccionados,
        horariosIds: this.horariosSeleccionados
      })
    };

    console.log('Datos del usuario a enviar:', usuarioRequest);
    console.log('Es trabajador:', this.esTrabajador);
    console.log('Servicios seleccionados:', this.serviciosSeleccionados);
    console.log('Horarios seleccionados:', this.horariosSeleccionados);

    // Agregar el JSON del usuario
    formData.append('usuario', new Blob([JSON.stringify(usuarioRequest)], { type: 'application/json' }));

    // Agregar la foto si existe
    if (this.fotoSeleccionada) {
      formData.append('foto', this.fotoSeleccionada);
      console.log('Foto adjuntada:', this.fotoSeleccionada.name);
    }

    // Si es trabajador y hay datos de contrato, incluirlos
    if (this.esTrabajador && usuarioData.contrato && this.mostrarFormularioContrato) {
      console.log('Datos del contrato:', usuarioData.contrato);
      formData.append('fechaInicioContrato', usuarioData.contrato.fechaInicio);
      if (usuarioData.contrato.fechaFin) {
        formData.append('fechaFinContrato', usuarioData.contrato.fechaFin);
      }
      formData.append('tipoContrato', usuarioData.contrato.tipoContrato);
      formData.append('salario', usuarioData.contrato.salario.toString());
    }

    // Agregar el documento del contrato si existe
    if (this.contratoDocumento) {
      formData.append('documentoContrato', this.contratoDocumento);
      console.log('Documento de contrato adjuntado:', this.contratoDocumento.name);
    }

    try {
      let response;
      let contratoFile;

      // Generar el PDF pero no añadirlo al FormData todavía
      if (this.modo === 'crear' && this.esTrabajador) {
        console.log('Generando PDF del contrato...');
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
          console.log('PDF del contrato generado y adjuntado');
        }
        console.log('Enviando petición de creación...');
        response = await this.usuarioService.crear(formData).toPromise();
      } else {
        console.log('Enviando petición de actualización para el usuario:', this.usuarioAEditar!.id);
        response = await this.usuarioService.actualizar(this.usuarioAEditar!.id, formData).toPromise();
      }

      console.log('Respuesta recibida:', response);

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
      } else {
        control.markAsTouched();
      }
    });
  }
}
