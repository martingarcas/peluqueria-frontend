import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CitaService } from 'src/app/services/cita/cita.service';
import { ServicioService } from 'src/app/services/servicio/servicio.service';
import { UsuarioService } from 'src/app/services/usuario/usuario.service';
import { CitaRequest, CitasRequest } from 'src/app/models/citas/cita-request';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, takeUntil, map, switchMap } from 'rxjs/operators';
import { ContratoService } from 'src/app/services/contrato/contrato.service';

interface DisponibilidadResponse {
  slots: Array<{
    hora: string;
    disponible: boolean;
  }>;
}

interface TrabajadoresResponse {
  trabajadoresNoDisponibles: number[];
}

interface ServiciosResponse {
  servicios: any[];
}

interface ProfesionalesResponse {
  trabajadores: Array<{
    id: number;
    nombre: string;
    apellidos: string;
    foto?: string;
  }>;
}

@Component({
  selector: 'app-form-cita',
  templateUrl: './form-cita.component.html',
  styleUrls: ['./form-cita.component.css']
})
export class FormCitaComponent implements OnInit, OnDestroy {
  @Output() formularioCerrado = new EventEmitter<void>();
  @Output() citaGuardada = new EventEmitter<string>();

  private destroy$ = new Subject<void>();

  // Cache de imágenes
  imagenesCache = new Map<string, SafeUrl>();

  // Datos de servicios
  servicios: any[] = [];
  servicioSeleccionado: number | null = null;

  // Datos de profesionales
  profesionales: any[] = [];
  profesionalesNoDisponibles: number[] = [];
  profesionalSeleccionado: number | null = null;

  // Datos de fecha
  fechaSeleccionada: string = '';
  mesActual: Date = new Date();
  diasNoDisponibles: string[] = [];

  // Datos de hora
  horasDisponibles: string[] = [];
  todasLasHoras: string[] = [];
  horaSeleccionada: string = '';
  horasPredefinidas = {
    manana: {
      bloque1: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'],
      bloque2: ['11:30', '12:00', '12:30', '13:00', '13:30', '14:00']
    },
    tarde: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00']
  };

  // Control de mensajes
  mensajeError: string = '';
  mensajeExito: string = '';

  // Nombres de meses en español
  private mesesEnEspanol = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  constructor(
    private citaService: CitaService,
    private servicioService: ServicioService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private contratoService: ContratoService
  ) {
    this.todasLasHoras = [
      ...this.horasPredefinidas.manana.bloque1,
      ...this.horasPredefinidas.manana.bloque2,
      ...this.horasPredefinidas.tarde
    ];
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Limpiar las URLs de blob
    this.imagenesCache.forEach((safeUrl, key) => {
      if (typeof safeUrl === 'string' && safeUrl.startsWith('blob:')) {
        URL.revokeObjectURL(safeUrl);
      }
    });

    // Limpiar el caché
    this.imagenesCache.clear();
  }

  private cargarDatosIniciales(): void {
    forkJoin({
      servicios: this.servicioService.obtenerTodos(),
      profesionales: this.usuarioService.obtenerTrabajadores()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.servicios = response.servicios.servicios;
        this.profesionales = response.profesionales.usuarios;

        // Para cada profesional, verificar si tiene contrato activo
        const observables = this.profesionales.map(profesional =>
          this.contratoService.verificarContratoActivo(profesional.id).pipe(
            map(contratoResponse => ({
              profesional,
              tieneContratoActivo: contratoResponse.tieneContratoActivo
            }))
          )
        );

        if (observables.length > 0) {
          forkJoin(observables).subscribe({
            next: (resultados) => {
              // Filtrar solo los profesionales con contrato activo
              this.profesionales = resultados
                .filter(r => r.tieneContratoActivo)
                .map(r => r.profesional);
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error('Error al verificar contratos:', error);
              this.mostrarError('Error al verificar los contratos');
            }
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar datos iniciales:', error);
        this.mostrarError('Error al cargar los datos iniciales');
      }
    });
  }

  private actualizarDisponibilidadServicio(): void {
    if (!this.servicioSeleccionado) {
      this.profesionalesNoDisponibles = [];
      this.horasDisponibles = [...this.todasLasHoras];
      this.diasNoDisponibles = [];
      return;
    }

    this.citaService.obtenerTrabajadoresDisponibles(this.servicioSeleccionado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ProfesionalesResponse) => {
          const trabajadoresDisponibles = response.trabajadores.map(t => t.id);
          this.profesionalesNoDisponibles = this.profesionales
            .filter(p => !trabajadoresDisponibles.includes(p.id))
            .map(p => p.id);

          // Si no hay profesionales disponibles, deshabilitamos todo
          if (trabajadoresDisponibles.length === 0) {
            this.horasDisponibles = [];
            this.diasNoDisponibles = this.obtenerTodosLosDiasDelMes(
              new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1),
              new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0)
            );
            this.cdr.detectChanges();
            return;
          }

          // Primero actualizamos los días disponibles
          this.actualizarDominiosDias();

          // Después de actualizar los días, comprobamos las horas para cada combinación
          const profesionalesActivos = this.profesionales.filter(p => !this.profesionalesNoDisponibles.includes(p.id));
          const diasActivos = this.obtenerTodosLosDiasDelMes(
            new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1),
            new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0)
          ).filter(dia => !this.diasNoDisponibles.includes(dia));

          // Inicializamos todas las horas como no disponibles
          this.horasDisponibles = [];

          // Para cada profesional y día, comprobamos las horas disponibles
          profesionalesActivos.forEach(profesional => {
            diasActivos.forEach(dia => {
              this.citaService.obtenerDisponibilidad(
                profesional.id,
                this.servicioSeleccionado!,
                dia
              ).pipe(
                takeUntil(this.destroy$)
              ).subscribe({
                next: (response: DisponibilidadResponse) => {
                  // Añadimos las horas disponibles que encontremos
                  response.slots.forEach(slot => {
                    if (slot.disponible && !this.horasDisponibles.includes(slot.hora)) {
                      this.horasDisponibles.push(slot.hora);
                    }
                  });
                  this.cdr.detectChanges();
                },
                error: (error) => {
                  console.error('Error al obtener disponibilidad:', error);
                }
              });
            });
          });
        },
        error: (error) => {
          console.error('Error al actualizar disponibilidad:', error);
          this.mostrarError('Error al actualizar la disponibilidad');
        }
      });
  }

  private actualizarFiltradoMultidireccional(): void {
    if (!this.servicioSeleccionado) return;

    const observables: {
      disponibilidad?: Observable<DisponibilidadResponse>;
      trabajadoresNoDisponibles?: Observable<TrabajadoresResponse>;
    } = {};

    // Si tenemos profesional y fecha seleccionados, obtenemos disponibilidad
    if (this.profesionalSeleccionado && this.fechaSeleccionada) {
      observables.disponibilidad = this.citaService.obtenerDisponibilidad(
        this.profesionalSeleccionado,
        this.servicioSeleccionado,
        this.fechaSeleccionada
      );
    }
    // Si tenemos fecha seleccionada (con o sin hora), obtenemos disponibilidad de todos los trabajadores
    else if (this.fechaSeleccionada) {
      // Primero obtenemos los trabajadores disponibles para el servicio
      this.citaService.obtenerTrabajadoresDisponibles(this.servicioSeleccionado)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(response => {
            const trabajadoresDisponibles = response.trabajadores as Array<{id: number}>;

            // Obtenemos la disponibilidad de cada trabajador para la fecha seleccionada
            const observablesTrabajadores = trabajadoresDisponibles.map(trabajador => {
              return this.citaService.obtenerDisponibilidad(
                trabajador.id,
                this.servicioSeleccionado!,
                this.fechaSeleccionada
              );
            });

            return forkJoin(observablesTrabajadores);
          })
        )
        .subscribe({
          next: (responses) => {
            // Combinamos todos los slots de todos los trabajadores
            const todosLosSlots = responses.flatMap(response => response.slots);

            // Una hora está disponible si al menos un trabajador la tiene disponible
            const horasDisponibles = this.todasLasHoras.filter(hora =>
              todosLosSlots.some(slot => slot.hora === hora && slot.disponible)
            );

            this.horasDisponibles = horasDisponibles;
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error al obtener disponibilidad:', error);
            this.mostrarError('Error al actualizar la disponibilidad');
          }
        });
      return;
    }
    // Si solo tenemos hora seleccionada, obtenemos días no disponibles
    else if (this.horaSeleccionada) {
      const primerDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1);
      const ultimoDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0);

      console.log('Hora seleccionada:', this.horaSeleccionada);
      console.log('Primer día:', primerDia.toISOString().split('T')[0]);
      console.log('Último día:', ultimoDia.toISOString().split('T')[0]);

      // Primero obtenemos los trabajadores disponibles para el servicio
      this.citaService.obtenerTrabajadoresDisponibles(this.servicioSeleccionado)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(response => {
            console.log('Trabajadores disponibles:', response.trabajadores);
            const trabajadoresDisponibles = response.trabajadores as Array<{id: number}>;

            // Para cada día del mes, verificamos la disponibilidad de cada trabajador
            const todosLosDias = this.obtenerTodosLosDiasDelMes(primerDia, ultimoDia);
            const observablesPorDia = todosLosDias.map(dia => {
              const observablesTrabajadores = trabajadoresDisponibles.map(trabajador => {
                return this.citaService.obtenerDisponibilidad(
                  trabajador.id,
                  this.servicioSeleccionado!,
                  dia
                );
              });
              return forkJoin(observablesTrabajadores).pipe(
                map(responses => ({
                  dia,
                  disponible: responses.some(response =>
                    response.slots.some((slot: { hora: string; disponible: boolean }) =>
                      slot.hora === this.horaSeleccionada && slot.disponible
                    )
                  )
                }))
              );
            });

            return forkJoin(observablesPorDia);
          })
        )
        .subscribe({
          next: (resultados) => {
            console.log('Resultados por día:', resultados);
            // Filtramos los días que no están disponibles
            const diasNoDisponibles = resultados
              .filter(r => !r.disponible)
              .map(r => r.dia);

            console.log('Días no disponibles:', diasNoDisponibles);
            this.diasNoDisponibles = diasNoDisponibles;
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error al obtener disponibilidad:', error);
            this.mostrarError('Error al actualizar la disponibilidad');
          }
        });
      return;
    }

    if (Object.keys(observables).length > 0) {
      forkJoin(observables)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (responses: any) => {
            if (responses.disponibilidad) {
              this.actualizarHorasDisponibles(responses.disponibilidad.slots);
            }
            if (responses.trabajadoresNoDisponibles) {
              this.profesionalesNoDisponibles = responses.trabajadoresNoDisponibles.trabajadoresNoDisponibles;
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error al actualizar filtrado:', error);
            this.mostrarError('Error al actualizar la disponibilidad');
          }
        });
    }
  }

  private actualizarDominiosDias(): void {
    if (!this.servicioSeleccionado) {
      this.diasNoDisponibles = [];
      return;
    }

    const primerDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1);
    const ultimoDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0);

    // Primero obtenemos los días disponibles basados en horarios y contratos activos
    this.citaService.obtenerDiasDisponibles(
      this.servicioSeleccionado,
      primerDia.toISOString().split('T')[0],
      ultimoDia.toISOString().split('T')[0]
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: { diasDisponibles: string[] }) => {
        // Convertimos los días disponibles a no disponibles (invertimos la lógica)
        const todosLosDias = this.obtenerTodosLosDiasDelMes(primerDia, ultimoDia);
        this.diasNoDisponibles = todosLosDias.filter(dia => !response.diasDisponibles.includes(dia));

        // Si hay un profesional seleccionado, verificamos sus citas
        if (this.profesionalSeleccionado) {
          this.verificarCitasProfesional();
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al obtener días disponibles:', error);
        this.mostrarError('Error al cargar los días disponibles');
      }
    });
  }

  private obtenerTodosLosDiasDelMes(primerDia: Date, ultimoDia: Date): string[] {
    const dias = [];
    let fechaActual = new Date(primerDia);

    while (fechaActual <= ultimoDia) {
      const año = fechaActual.getFullYear();
      const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
      const dia = fechaActual.getDate().toString().padStart(2, '0');

      dias.push(`${año}-${mes}-${dia}`);
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return dias;
  }

  private verificarCitasProfesional(): void {
    if (!this.profesionalSeleccionado || !this.servicioSeleccionado) return;

    // Para cada día disponible, verificamos si el profesional tiene citas
    const diasAConsultar = this.diasNoDisponibles.map(dia => {
      return this.citaService.obtenerDisponibilidad(
        this.profesionalSeleccionado!,
        this.servicioSeleccionado!,
        dia
      ).pipe(
        map(response => ({
          dia,
          disponible: response.slots.some((slot: { disponible: boolean }) => slot.disponible)
        }))
      );
    });

    if (diasAConsultar.length > 0) {
      forkJoin(diasAConsultar).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (resultados) => {
          // Actualizamos los días no disponibles basados en las citas
          const diasConCitas = resultados
            .filter(r => !r.disponible)
            .map(r => r.dia);

          this.diasNoDisponibles = [...new Set([...this.diasNoDisponibles, ...diasConCitas])];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al verificar citas del profesional:', error);
        }
      });
    }
  }

  private actualizarDominiosHoras(): void {
    if (!this.servicioSeleccionado) {
      this.horasDisponibles = [...this.todasLasHoras];
      return;
    }

    if (this.profesionalSeleccionado && this.fechaSeleccionada) {
      this.citaService.obtenerDisponibilidad(
        this.profesionalSeleccionado,
        this.servicioSeleccionado,
        this.fechaSeleccionada
      ).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: DisponibilidadResponse) => {
          this.actualizarHorasDisponibles(response.slots);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al obtener horas disponibles:', error);
        }
      });
    } else {
      this.horasDisponibles = [...this.todasLasHoras];
    }
  }

  seleccionarServicio(servicioId: number): void {
    // Primero limpiamos todo el estado
    this.profesionalSeleccionado = null;
    this.fechaSeleccionada = '';
    this.horaSeleccionada = '';
    this.horasDisponibles = [...this.todasLasHoras];
    this.diasNoDisponibles = [];
    this.profesionalesNoDisponibles = [];

    if (this.servicioSeleccionado === servicioId) {
      this.servicioSeleccionado = null;
    } else {
      this.servicioSeleccionado = servicioId;
      this.actualizarDisponibilidadServicio();
    }
  }

  seleccionarProfesional(profesionalId: number): void {
    if (!this.esProfesionalDisponible(profesionalId)) return;

    if (this.profesionalSeleccionado === profesionalId) {
      this.profesionalSeleccionado = null;
      // Si deseleccionamos el profesional, actualizamos basándonos en la fecha y hora si están seleccionadas
      if (this.fechaSeleccionada && this.horaSeleccionada) {
        this.actualizarFiltradoMultidireccional();
      } else if (this.fechaSeleccionada) {
        this.actualizarDominiosHoras();
      } else if (this.horaSeleccionada) {
        this.actualizarFiltradoMultidireccional();
      }
    } else {
      this.profesionalSeleccionado = profesionalId;
      this.actualizarFiltradoMultidireccional();
    }
  }

  seleccionarFecha(fecha: string): void {
    if (!this.esDiaDisponible(fecha)) return;

    if (this.fechaSeleccionada === fecha) {
      this.fechaSeleccionada = '';
      // Si deseleccionamos la fecha, actualizamos basándonos en el profesional y hora si están seleccionados
      if (this.profesionalSeleccionado && this.horaSeleccionada) {
        this.actualizarFiltradoMultidireccional();
      } else if (this.profesionalSeleccionado) {
        this.actualizarDominiosHoras();
      } else if (this.horaSeleccionada) {
        this.actualizarFiltradoMultidireccional();
      } else {
        // Si no hay nada más seleccionado, actualizamos todo
        this.actualizarDisponibilidadServicio();
      }
    } else {
      this.fechaSeleccionada = fecha;
      // Siempre actualizamos la disponibilidad al seleccionar una fecha
      this.actualizarFiltradoMultidireccional();
    }
  }

  seleccionarHora(hora: string): void {
    if (!this.esHoraDisponible(hora)) return;

    if (this.horaSeleccionada === hora) {
      this.horaSeleccionada = '';
      // Si deseleccionamos la hora, actualizamos basándonos en el profesional y fecha si están seleccionados
      if (this.profesionalSeleccionado && this.fechaSeleccionada) {
        this.actualizarFiltradoMultidireccional();
      } else if (this.profesionalSeleccionado) {
        this.actualizarDominiosDias();
      } else if (this.fechaSeleccionada) {
        this.actualizarFiltradoMultidireccional();
      } else {
        // Si no hay nada más seleccionado, actualizamos todo
        this.actualizarDisponibilidadServicio();
      }
    } else {
      this.horaSeleccionada = hora;
      // Siempre actualizamos la disponibilidad al seleccionar una hora
      this.actualizarFiltradoMultidireccional();
    }
  }

  private actualizarHorasDisponibles(slots: Array<{ hora: string; disponible: boolean }>): void {
    this.horasDisponibles = slots
      .filter(slot => slot.disponible)
      .map(slot => slot.hora);
  }

  esProfesionalDisponible(profesionalId: number): boolean {
    if (!this.servicioSeleccionado) return false;
    return !this.profesionalesNoDisponibles.includes(profesionalId);
  }

  esDiaDisponible(fecha: string): boolean {
    if (!this.servicioSeleccionado) return false;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaAComprobar = new Date(fecha);
    fechaAComprobar.setHours(0, 0, 0, 0);

    // Si la fecha es anterior a hoy, no está disponible
    if (fechaAComprobar < hoy) return false;

    // Si el día está en la lista de días no disponibles, no está disponible
    if (this.diasNoDisponibles.includes(fecha)) return false;

    // Si no está en la lista de días no disponibles, está disponible
    return true;
  }

  esHoraDisponible(hora: string): boolean {
    if (!this.servicioSeleccionado) return false;
    if (this.profesionalesNoDisponibles.length === this.profesionales.length) return false;
    return this.horasDisponibles.includes(hora);
  }

  private limpiarSelecciones(): void {
    this.profesionalSeleccionado = null;
    this.fechaSeleccionada = '';
    this.horaSeleccionada = '';
    this.horasDisponibles = [...this.todasLasHoras];
  }

  getImageUrl(fotoPath: string | undefined): SafeUrl {
    if (!fotoPath) return 'assets/images/no-image.png';

    if (this.imagenesCache.has(fotoPath)) {
      return this.imagenesCache.get(fotoPath)!;
    }

    this.usuarioService.obtenerImagen(fotoPath).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.imagenesCache.set(fotoPath, safeUrl);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar la imagen:', error);
        this.imagenesCache.set(fotoPath, 'assets/images/no-image.png');
      }
    });

    return 'assets/images/no-image.png';
  }

  get nombreMes(): string {
    return `${this.mesesEnEspanol[this.mesActual.getMonth()]} ${this.mesActual.getFullYear()}`;
  }

  cambiarMes(incremento: number): void {
    const hoy = new Date();
    const nuevaFecha = new Date(this.mesActual);
    nuevaFecha.setMonth(this.mesActual.getMonth() + incremento);

    if (nuevaFecha.getFullYear() < hoy.getFullYear() ||
        (nuevaFecha.getFullYear() === hoy.getFullYear() && nuevaFecha.getMonth() < hoy.getMonth())) {
      return;
    }

    this.mesActual = nuevaFecha;
    this.actualizarDominiosDias();
  }

  obtenerDiasDelMes(): number[] {
    const primerDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1);
    const ultimoDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0);

    const diaSemana = primerDia.getDay();
    const diasVaciosInicio = (diaSemana + 6) % 7;
    const diasVaciosArray = Array(diasVaciosInicio).fill(null);

    const diasDelMes = [];
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      diasDelMes.push(i);
    }

    const totalDias = diasVaciosInicio + diasDelMes.length;
    const diasVaciosFinal = (7 - (totalDias % 7)) % 7;
    const diasVaciosFinalArray = Array(diasVaciosFinal).fill(null);

    return [...diasVaciosArray, ...diasDelMes, ...diasVaciosFinalArray];
  }

  obtenerFechaFormateada(dia: number): string {
    if (!dia) return '';

    const year = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth() + 1;
    const diaFormateado = dia < 10 ? `0${dia}` : `${dia}`;
    const mesFormateado = month < 10 ? `0${month}` : `${month}`;

    return `${year}-${mesFormateado}-${diaFormateado}`;
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
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  reservarCita(): void {
    if (!this.servicioSeleccionado || !this.profesionalSeleccionado ||
        !this.fechaSeleccionada || !this.horaSeleccionada) {
      this.mostrarError('Por favor, complete todos los campos requeridos');
      return;
    }

    // Formatear la hora para que sea compatible con java.sql.Time
    const horaFormateada = this.horaSeleccionada + ':00';

    const cita: CitaRequest = {
      servicioId: this.servicioSeleccionado,
      trabajadorId: this.profesionalSeleccionado,
      fecha: this.fechaSeleccionada,
      horaInicio: horaFormateada
    };

    const citasRequest: CitasRequest = {
      citas: [cita]
    };

    this.citaService.crearCita(citasRequest).subscribe({
      next: (response) => {
        this.mostrarExito('Cita reservada con éxito');
        this.citaGuardada.emit(response.mensaje);
        this.limpiarFormulario();
      },
      error: (error) => {
        console.error('Error al reservar la cita:', error);
        this.mostrarError(error.error?.mensaje || 'Error al reservar la cita');
      }
    });
  }

  private limpiarFormulario(): void {
    this.servicioSeleccionado = null;
    this.profesionalSeleccionado = null;
    this.fechaSeleccionada = '';
    this.horaSeleccionada = '';
    this.horasDisponibles = [];
    this.diasNoDisponibles = [];
    this.profesionalesNoDisponibles = [];
  }
}
