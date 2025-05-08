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
      this.usuarioForm.get('password')?.clearValidators();
      this.usuarioForm.get('password')?.updateValueAndValidity();
      this.cargarUsuario();
    } else if (this.modo === 'crear') {
      this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.usuarioForm.get('password')?.updateValueAndValidity();
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
      direccion: this.usuarioAEditar.direccion,
      role: this.usuarioAEditar.role
    });

    if (this.usuarioAEditar.contrato) {
      this.usuarioForm.patchValue({
        contrato: {
          fechaInicio: this.usuarioAEditar.contrato.fechaInicio,
          fechaFin: this.usuarioAEditar.contrato.fechaFin,
          tipoContrato: this.usuarioAEditar.contrato.tipoContrato,
          salario: this.usuarioAEditar.contrato.salario
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
      this.mostrarError('Por favor, complete todos los campos requeridos correctamente');
      return;
    }

    if (this.esTrabajador) {
      if (!this.fotoSeleccionada && this.modo === 'crear' && !this.usuarioAEditar?.foto) {
        this.mostrarError('La foto es obligatoria para trabajadores');
        return;
      }

      if (this.serviciosSeleccionados.length === 0) {
        this.mostrarError('Debe seleccionar al menos un servicio');
        return;
      }

      if (this.horariosSeleccionados.length === 0) {
        this.mostrarError('Debe seleccionar al menos un horario');
        return;
      }

      // Generar el PDF del contrato
      try {
        const datosContrato = {
          nombre: this.usuarioForm.get('nombre')?.value,
          apellidos: this.usuarioForm.get('apellidos')?.value,
          fechaInicio: this.usuarioForm.get('contrato.fechaInicio')?.value,
          fechaFin: this.usuarioForm.get('contrato.fechaFin')?.value,
          tipoContrato: this.usuarioForm.get('contrato.tipoContrato')?.value,
          salario: this.usuarioForm.get('contrato.salario')?.value
        };

        const documento = await this.pdfService.generarContratoTrabajador(datosContrato).toPromise();
        this.contratoDocumento = documento || null;
      } catch (error) {
        this.mostrarError('Error al generar el contrato');
        console.error('Error:', error);
        return;
      }
    }

    const usuarioRequest: UsuarioRequest = {
      nombre: this.usuarioForm.get('nombre')?.value,
      apellidos: this.usuarioForm.get('apellidos')?.value,
      email: this.usuarioForm.get('email')?.value,
      password: this.usuarioForm.get('password')?.value,
      telefono: this.usuarioForm.get('telefono')?.value,
      direccion: this.usuarioForm.get('direccion')?.value,
      role: this.usuarioForm.get('role')?.value,
      foto: this.fotoSeleccionada || undefined
    };

    if (this.esTrabajador) {
      usuarioRequest.contrato = {
        fechaInicio: this.usuarioForm.get('contrato.fechaInicio')?.value,
        fechaFin: this.usuarioForm.get('contrato.fechaFin')?.value,
        tipoContrato: this.usuarioForm.get('contrato.tipoContrato')?.value,
        salario: this.usuarioForm.get('contrato.salario')?.value,
        documento: this.contratoDocumento || undefined
      };
      usuarioRequest.serviciosIds = this.serviciosSeleccionados;
      usuarioRequest.horariosIds = this.horariosSeleccionados;
    }

    try {
      let response;
      if (this.modo === 'crear') {
        response = await this.usuarioService.crear(usuarioRequest).toPromise();
      } else {
        response = await this.usuarioService.actualizar(this.usuarioAEditar!.id, usuarioRequest).toPromise();
      }

      this.onGuardar.emit(response);
      this.mostrarExito('Usuario guardado correctamente');
    } catch (error: any) {
      this.mostrarError(error.error?.mensaje || 'Error al guardar el usuario');
      console.error('Error:', error);
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
