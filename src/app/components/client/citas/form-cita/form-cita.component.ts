import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CitaService } from 'src/app/services/cita/cita.service';
import { ServicioService } from 'src/app/services/servicio/servicio.service';
import { UsuarioService } from 'src/app/services/usuario/usuario.service';
import { CitaRequest, CitasRequest } from 'src/app/models/citas/cita-request';
import { CitaResponse } from 'src/app/models/citas/cita-response';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, map, switchMap } from 'rxjs/operators';
import { ContratoService } from 'src/app/services/contrato/contrato.service';
import { Router } from '@angular/router';
import { DisponibilidadResponse, ProfesionalesResponse } from 'src/app/models/citas/cita.interface';

/**
 * Componente para gestionar el formulario de reserva de citas.
 * Permite seleccionar servicio, profesional, fecha y hora para crear citas.
 * Maneja la disponibilidad en tiempo real y previene solapamientos.
 */
@Component({
  selector: 'app-form-cita',
  templateUrl: './form-cita.component.html',
  styleUrls: ['./form-cita.component.css']
})
export class FormCitaComponent implements OnInit, OnDestroy {
  // Eventos de salida para notificar al componente padre
  @Output() formularioCerrado = new EventEmitter<void>();
  @Output() citaGuardada = new EventEmitter<string>();

  // Subject para manejar la limpieza de suscripciones
  private destroy$ = new Subject<void>();

  // Datos de servicios disponibles y seleccionado
  servicios: any[] = [];
  servicioSeleccionado: number | null = null;

  // Datos de profesionales disponibles y seleccionado
  profesionales: any[] = [];
  profesionalesNoDisponibles: number[] = [];
  profesionalSeleccionado: number | null = null;

  // Datos de fecha seleccionada y control del calendario
  fechaSeleccionada: string = '';
  mesActual: Date = new Date();
  diasNoDisponibles: string[] = [];

  // Datos de horas disponibles y seleccionada
  horasDisponibles: string[] = [];
  todasLasHoras: string[] = [];
  horaSeleccionada: string = '';
  // Horarios predefinidos para mañana y tarde
  horasPredefinidas = {
    manana: {
      bloque1: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'],
      bloque2: ['11:30', '12:00', '12:30', '13:00', '13:30', '14:00']
    },
    tarde: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00']
  };

  // Control de mensajes de éxito y error
  mensajeError: string = '';
  mensajeExito: string = '';

  // Nombres de meses en español para el calendario
  private mesesEnEspanol = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  // Array para almacenar las citas en proceso de reserva
  citasEnProceso: Array<{
    cita: CitaRequest;
    servicioNombre: string;
    trabajadorNombre: string;
  }> = [];

  // Control del modal de confirmación
  mostrarModal = false;

  // Array para almacenar las citas del usuario en formato fecha-hora
  citasUsuario: string[] = [];

  /**
   * Constructor del componente.
   * Inicializa los servicios necesarios y configura las horas disponibles.
   */
  constructor(
    private citaService: CitaService,
    private servicioService: ServicioService,
    private usuarioService: UsuarioService,
    private changeDetectorRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private contratoService: ContratoService,
    private router: Router
  ) {
    this.todasLasHoras = [
      ...this.horasPredefinidas.manana.bloque1,
      ...this.horasPredefinidas.manana.bloque2,
      ...this.horasPredefinidas.tarde
    ];
  }

  /**
   * Inicializa el componente cargando los datos necesarios:
   * - Lista de servicios disponibles
   * - Lista de profesionales activos
   * - Citas existentes del usuario
   */
  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.cargarCitasUsuario();
  }

  /**
   * Limpia los recursos al destruir el componente:
   * - Cancela todas las suscripciones activas
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos iniciales del formulario.
   * Obtiene servicios y profesionales disponibles.
   */
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

        // Cargar imágenes de los profesionales
        this.profesionales.forEach(profesional => {
          if (profesional.foto) {
            this.usuarioService.obtenerImagen(profesional.foto).subscribe({
              next: (blob: Blob) => {
                const objectUrl = URL.createObjectURL(blob);
                profesional.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
              },
              error: () => {
                profesional.imagenUrl = 'assets/images/no-image.png';
              }
            });
          }
        });

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
                .filter(resultadoContrato => resultadoContrato.tieneContratoActivo)
                .map(resultadoContrato => resultadoContrato.profesional);
              this.changeDetectorRef.detectChanges();
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

  /**
   * Carga las citas existentes del usuario.
   * Filtra citas canceladas y formatea fechas.
   */
  private cargarCitasUsuario(): void {
    this.citaService.obtenerCitasUsuario().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        // La respuesta viene en formato { mensaje: string, citas: { citas: CitaResponse[] } }
        if (response.citas && response.citas.citas) {
          // Guardamos solo fecha y hora en formato "YYYY-MM-DD-HH:mm" de citas que no estén canceladas
          this.citasUsuario = response.citas.citas
            .filter((cita: CitaResponse) => cita.estado !== 'CANCELADA')
            .map((cita: CitaResponse) => {
              const hora = cita.horaInicio.split(':').slice(0, 2).join(':');
              return `${cita.fecha}-${hora}`;
            });
          this.changeDetectorRef.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error al cargar citas del usuario:', error);
      }
    });
  }

  /**
   * Actualiza la disponibilidad según las selecciones.
   * Maneja diferentes escenarios de selección.
   */
  private actualizarFiltradoMultidireccional(): void {
    if (!this.servicioSeleccionado) return;

    // Si tenemos profesional y fecha seleccionados
    if (this.profesionalSeleccionado && this.fechaSeleccionada) {
        this.actualizarDisponibilidadProfesionalFecha();
    }
    // Si solo tenemos profesional seleccionado
    else if (this.profesionalSeleccionado) {
        this.actualizarDisponibilidadSoloProfesional();
    }
    // Si solo tenemos fecha seleccionada
    else if (this.fechaSeleccionada) {
        this.actualizarDisponibilidadSoloFecha();
    }
    // Si solo tenemos hora seleccionada
    else if (this.horaSeleccionada) {
        this.actualizarDisponibilidadSoloHora();
    }
  }

  /**
   * Actualiza disponibilidad para profesional y fecha.
   * Verifica horas disponibles para esa combinación.
   */
  private actualizarDisponibilidadProfesionalFecha(): void {
    if (!this.profesionalSeleccionado) return;

    const profesionalId: number = this.profesionalSeleccionado;
    this.citaService.obtenerDisponibilidad(
        profesionalId,
        this.servicioSeleccionado!,
        this.fechaSeleccionada
    ).pipe(
        takeUntil(this.destroy$)
    ).subscribe({
        next: (response: DisponibilidadResponse) => {
            this.actualizarHorasDisponibles(response.slots);
            this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
            console.error('Error al obtener disponibilidad:', error);
            this.mostrarError('Error al actualizar la disponibilidad');
        }
    });
  }

  /**
   * Actualiza disponibilidad solo para profesional.
   * Verifica días y horas disponibles.
   */
  private actualizarDisponibilidadSoloProfesional(): void {
    if (!this.profesionalSeleccionado) return;

    const profesionalId: number = this.profesionalSeleccionado;
    const primerDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1);
    const ultimoDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0);
    const todosLosDias = this.obtenerTodosLosDiasDelMes(primerDia, ultimoDia);

    // Para cada día, verificamos la disponibilidad del profesional
    const observablesPorDia = todosLosDias.map(dia => {
        return this.citaService.obtenerDisponibilidad(
            profesionalId,
            this.servicioSeleccionado!,
            dia
        );
    });

    forkJoin(observablesPorDia)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: (responses) => {
                // Filtramos los días que no tienen ninguna hora disponible
                const diasNoDisponibles = todosLosDias.filter((dia, index) => {
                    const response = responses[index];
                    return !response.slots.some((slot: { hora: string; disponible: boolean }) => slot.disponible);
                });

                this.diasNoDisponibles = diasNoDisponibles;

                // Obtenemos los días disponibles y filtramos los que son anteriores a hoy
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);

                const diasDisponibles = todosLosDias.filter(dia => {
                    const fechaDia = new Date(dia);
                    fechaDia.setHours(0, 0, 0, 0);
                    return !this.diasNoDisponibles.includes(dia) && fechaDia >= hoy;
                });

                // Para cada día disponible, comprobamos la disponibilidad del profesional
                const observablesPorDia = diasDisponibles.map(dia => {
                    return this.citaService.obtenerDisponibilidad(
                        profesionalId,
                        this.servicioSeleccionado!,
                        dia
                    );
                });

                forkJoin(observablesPorDia)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: (responses) => {
                            // Una hora está disponible si está disponible en al menos un día
                            const horasDisponibles = new Set<string>();

                            responses.forEach(response => {
                                response.slots.forEach((slot: { hora: string; disponible: boolean }) => {
                                    if (slot.disponible) {
                                        horasDisponibles.add(slot.hora);
                                    }
                                });
                            });

                            this.horasDisponibles = Array.from(horasDisponibles);

                            // Si hay una fecha seleccionada, actualizamos las horas disponibles
                            if (this.fechaSeleccionada) {
                                const responseFechaSeleccionada = responses[diasDisponibles.indexOf(this.fechaSeleccionada)];
                                if (responseFechaSeleccionada) {
                                    this.actualizarHorasDisponibles(responseFechaSeleccionada.slots);
                                }
                            }

                            this.changeDetectorRef.detectChanges();
                        },
                        error: (error) => {
                            console.error('Error al obtener disponibilidad:', error);
                            this.mostrarError('Error al actualizar la disponibilidad');
                        }
                    });
            },
            error: (error) => {
                console.error('Error al obtener disponibilidad:', error);
                this.mostrarError('Error al actualizar la disponibilidad');
            }
        });
  }

  /**
   * Actualiza disponibilidad solo para fecha.
   * Verifica profesionales y horas disponibles.
   */
  private actualizarDisponibilidadSoloFecha(): void {
    if (!this.servicioSeleccionado) return;

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

                return forkJoin(observablesTrabajadores).pipe(
                    map(responses => {
                        // Filtramos los trabajadores que tienen al menos una hora disponible
                        const trabajadoresConDisponibilidad = trabajadoresDisponibles.filter((trabajador, index) => {
                            const response = responses[index];
                            return response.slots.some((slot: { hora: string; disponible: boolean }) => slot.disponible);
                        });

                        // Actualizamos la lista de profesionales no disponibles
                        this.profesionalesNoDisponibles = this.profesionales
                            .filter(p => !trabajadoresConDisponibilidad.some(t => t.id === p.id))
                            .map(p => p.id);

                        // Combinamos todos los slots de todos los trabajadores
                        const todosLosSlots = responses.flatMap(response => response.slots);

                        // Una hora está disponible si al menos un trabajador la tiene disponible
                        const horasDisponibles = this.todasLasHoras.filter(hora =>
                            todosLosSlots.some(slot => slot.hora === hora && slot.disponible)
                        );

                        this.horasDisponibles = horasDisponibles;
                        this.changeDetectorRef.detectChanges();
                    })
                );
            })
        )
        .subscribe({
            error: (error) => {
                console.error('Error al obtener disponibilidad:', error);
                this.mostrarError('Error al actualizar la disponibilidad');
            }
        });
  }

  /**
   * Actualiza disponibilidad solo para hora.
   * Verifica días y profesionales disponibles.
   */
  private actualizarDisponibilidadSoloHora(): void {
    if (!this.servicioSeleccionado) return;

    const primerDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1);
    const ultimoDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0);

    // Primero obtenemos los trabajadores disponibles para el servicio
    this.citaService.obtenerTrabajadoresDisponibles(this.servicioSeleccionado)
        .pipe(
            takeUntil(this.destroy$),
            switchMap(response => {
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
                // Filtramos los días que no están disponibles
                const diasNoDisponibles = resultados
                    .filter(resultado => !resultado.disponible)
                    .map(resultado => resultado.dia);

                this.diasNoDisponibles = diasNoDisponibles;
                this.changeDetectorRef.detectChanges();
            },
            error: (error) => {
                console.error('Error al obtener disponibilidad:', error);
                this.mostrarError('Error al actualizar la disponibilidad');
            }
        });
  }

  /**
   * Actualiza disponibilidad basada en servicio.
   * Verifica trabajadores y actualiza dominios.
   */
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
            this.changeDetectorRef.detectChanges();
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
                  this.changeDetectorRef.detectChanges();
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

  /**
   * Actualiza los días disponibles.
   * Considera horarios y contratos activos.
   */
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

        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al obtener días disponibles:', error);
        this.mostrarError('Error al cargar los días disponibles');
      }
    });
  }

  /**
   * Genera array de días del mes.
   * @param primerDia - Primer día del mes
   * @param ultimoDia - Último día del mes
   * @returns Array de fechas
   */
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

  /**
   * Verifica citas del profesional.
   * Actualiza días no disponibles.
   */
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
            .filter(disponibilidadDia => !disponibilidadDia.disponible)
            .map(disponibilidadDia => disponibilidadDia.dia);

          this.diasNoDisponibles = [...new Set([...this.diasNoDisponibles, ...diasConCitas])];
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('Error al verificar citas del profesional:', error);
        }
      });
    }
  }

  /**
   * Actualiza horas disponibles.
   * Considera horarios y citas existentes.
   */
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
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('Error al obtener horas disponibles:', error);
        }
      });
    } else {
      this.horasDisponibles = [...this.todasLasHoras];
    }
  }

  /**
   * Maneja selección de servicio.
   * @param servicioId - ID del servicio
   */
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

  /**
   * Maneja selección de profesional.
   * @param profesionalId - ID del profesional
   */
  seleccionarProfesional(profesionalId: number): void {
    if (!this.esProfesionalDisponible(profesionalId)) return;

    if (this.profesionalSeleccionado === profesionalId) {
      this.profesionalSeleccionado = null;
      // Si deseleccionamos el profesional, actualizamos basándonos en la fecha y hora si están seleccionadas
      if (this.fechaSeleccionada && this.horaSeleccionada) {
        this.actualizarFiltradoMultidireccional();
      } else if (this.fechaSeleccionada) {
        this.actualizarFiltradoMultidireccional();
      } else if (this.horaSeleccionada) {
        this.actualizarFiltradoMultidireccional();
      } else {
        // Si no hay nada más seleccionado, actualizamos todo
        this.actualizarDisponibilidadServicio();
      }
    } else {
      this.profesionalSeleccionado = profesionalId;
      // Siempre actualizamos la disponibilidad al seleccionar un profesional
      this.actualizarFiltradoMultidireccional();
    }
  }

  /**
   * Maneja selección de fecha.
   * @param fecha - Fecha seleccionada
   */
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

  /**
   * Maneja selección de hora.
   * @param hora - Hora seleccionada
   */
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

  /**
   * Actualiza horas disponibles.
   * @param slots - Slots de disponibilidad
   */
  private actualizarHorasDisponibles(slots: Array<{ hora: string; disponible: boolean }>): void {
    this.horasDisponibles = slots
      .filter(slot => slot.disponible)
      .map(slot => slot.hora);
  }

  /**
   * Verifica disponibilidad de profesional.
   * @param profesionalId - ID del profesional
   * @returns true si está disponible
   */
  esProfesionalDisponible(profesionalId: number): boolean {
    if (!this.servicioSeleccionado) return false;
    return !this.profesionalesNoDisponibles.includes(profesionalId);
  }

  /**
   * Verifica disponibilidad de día.
   * @param fecha - Fecha a verificar
   * @returns true si está disponible
   */
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

    // Si hay una hora seleccionada, comprobar si el usuario tiene una cita ese día a esa hora
    if (this.horaSeleccionada) {
      const citaBuscar = `${fecha}-${this.horaSeleccionada}`;
      if (this.citasUsuario.includes(citaBuscar)) return false;
    }

    return true;
  }

  /**
   * Verifica disponibilidad de hora.
   * @param hora - Hora a verificar
   * @returns true si está disponible
   */
  esHoraDisponible(hora: string): boolean {
    if (!this.servicioSeleccionado) return false;
    if (this.profesionalesNoDisponibles.length === this.profesionales.length) return false;
    if (!this.horasDisponibles.includes(hora)) return false;

    // Comprobar solapamiento con citas en proceso
    if (this.esHoraSolapada(hora)) return false;

    // Si hay una fecha seleccionada, comprobar si el usuario tiene una cita ese día a esa hora
    if (this.fechaSeleccionada) {
      const citaBuscar = `${this.fechaSeleccionada}-${hora}`;
      if (this.citasUsuario.includes(citaBuscar)) return false;
    }

    return true;
  }

  /**
   * Verifica si una hora específica está solapada con otras citas.
   * @param hora - Hora a verificar en formato HH:mm
   * @returns true si la hora está solapada
   */
  private esHoraSolapada(hora: string): boolean {
    if (this.citasEnProceso.length === 0) return false;

    // Obtener la duración del servicio seleccionado
    const servicio = this.servicios.find(s => s.id === this.servicioSeleccionado);
    if (!servicio) return false;

    // Convertir la hora de inicio a minutos para facilitar comparaciones
    const [horaInicio, minutoInicio] = hora.split(':').map(Number);
    const minutosInicio = horaInicio * 60 + minutoInicio;
    const minutosFin = minutosInicio + servicio.duracion;

    return this.citasEnProceso.some(citaExistente => {
      // Solo comprobar si es el mismo día
      if (citaExistente.cita.fecha !== this.fechaSeleccionada) return false;

      // Obtener la duración del servicio existente
      const servicioExistente = this.servicios.find(s => s.id === citaExistente.cita.servicioId);
      if (!servicioExistente) return false;

      // Convertir la hora de inicio de la cita existente a minutos
      const [horaExistente, minutoExistente] = citaExistente.cita.horaInicio.split(':').map(Number);
      const minutosInicioExistente = horaExistente * 60 + minutoExistente;
      const minutosFinExistente = minutosInicioExistente + servicioExistente.duracion;

      // Comprobar si hay solapamiento
      return (minutosInicio < minutosFinExistente && minutosFin > minutosInicioExistente);
    });
  }

  /**
   * Limpia las selecciones actuales del formulario.
   * Restablece profesional, fecha y hora seleccionados.
   */
  private limpiarSelecciones(): void {
    this.profesionalSeleccionado = null;
    this.fechaSeleccionada = '';
    this.horaSeleccionada = '';
    this.horasDisponibles = [...this.todasLasHoras];
  }

  /**
   * Obtiene el nombre del mes actual en español.
   * @returns Nombre del mes y año actual
   */
  get nombreMes(): string {
    return `${this.mesesEnEspanol[this.mesActual.getMonth()]} ${this.mesActual.getFullYear()}`;
  }

  /**
   * Cambia el mes mostrado en el calendario.
   * Previene la selección de meses pasados.
   * @param incremento - Número de meses a avanzar/retroceder
   */
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

  /**
   * Genera el array de días para el calendario.
   * Incluye días vacíos para alinear con el inicio de semana.
   * @returns Array con los días del mes y espacios vacíos
   */
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

  /**
   * Formatea un día del mes en formato YYYY-MM-DD.
   * @param dia - Día a formatear
   * @returns Fecha formateada
   */
  obtenerFechaFormateada(dia: number): string {
    if (!dia) return '';

    const year = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth() + 1;
    const diaFormateado = dia < 10 ? `0${dia}` : `${dia}`;
    const mesFormateado = month < 10 ? `0${month}` : `${month}`;

    return `${year}-${mesFormateado}-${diaFormateado}`;
  }

  /**
   * Muestra un mensaje de éxito temporal.
   * @param mensaje - Mensaje a mostrar
   */
  private mostrarExito(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mensajeError = '';
    setTimeout(() => this.limpiarMensajes(), 3000);
  }

  /**
   * Muestra un mensaje de error temporal.
   * @param mensaje - Mensaje a mostrar
   */
  private mostrarError(mensaje: string): void {
    this.mensajeError = mensaje;
    this.mensajeExito = '';
    setTimeout(() => this.limpiarMensajes(), 3000);
  }

  /**
   * Limpia los mensajes de éxito y error.
   */
  private limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  /**
   * Verifica si hay solapamiento entre citas.
   * @param citaNueva - Cita a verificar
   * @returns true si hay solapamiento
   */
  private haySolapamiento(citaNueva: CitaRequest): boolean {
    if (this.citasEnProceso.length === 0) return false;

    // Obtener la duración del servicio seleccionado
    const servicio = this.servicios.find(s => s.id === citaNueva.servicioId);
    if (!servicio) return false;

    // Convertir la hora de inicio a minutos para facilitar comparaciones
    const [horaInicio, minutoInicio] = citaNueva.horaInicio.split(':').map(Number);
    const minutosInicio = horaInicio * 60 + minutoInicio;
    const minutosFin = minutosInicio + servicio.duracion;

    return this.citasEnProceso.some(citaExistente => {
      // Solo comprobar si es el mismo día
      if (citaExistente.cita.fecha !== citaNueva.fecha) return false;

      // Obtener la duración del servicio existente
      const servicioExistente = this.servicios.find(s => s.id === citaExistente.cita.servicioId);
      if (!servicioExistente) return false;

      // Convertir la hora de inicio de la cita existente a minutos
      const [horaExistente, minutoExistente] = citaExistente.cita.horaInicio.split(':').map(Number);
      const minutosInicioExistente = horaExistente * 60 + minutoExistente;
      const minutosFinExistente = minutosInicioExistente + servicioExistente.duracion;

      // Comprobar si hay solapamiento
      return (minutosInicio < minutosFinExistente && minutosFin > minutosInicioExistente);
    });
  }

  /**
   * Agrega una nueva cita al proceso de reserva.
   * Verifica disponibilidad y solapamientos.
   */
  agregarCita(): void {
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

    // Verificar solapamiento antes de añadir la cita
    if (this.haySolapamiento(cita)) {
      this.mostrarError('No puedes reservar citas que se solapen. Por favor, elige otro horario.');
      return;
    }

    // Obtener nombres del servicio y trabajador
    const servicio = this.servicios.find(s => s.id === this.servicioSeleccionado);
    const trabajador = this.profesionales.find(p => p.id === this.profesionalSeleccionado);

    if (!servicio || !trabajador) {
      this.mostrarError('Error al obtener información del servicio o trabajador');
      return;
    }

    // Añadir la cita al array
    this.citasEnProceso.push({
      cita,
      servicioNombre: servicio.nombre,
      trabajadorNombre: `${trabajador.nombre} ${trabajador.apellidos}`
    });

    // Limpiar selecciones para la siguiente cita
    this.limpiarSelecciones();
  }

  /**
   * Elimina una cita del proceso de reserva.
   * @param servicioId - ID del servicio a eliminar
   */
  eliminarCita(servicioId: number): void {
    this.citasEnProceso = this.citasEnProceso.filter(c => c.cita.servicioId !== servicioId);
  }

  /**
   * Muestra el modal de confirmación.
   */
  mostrarModalConfirmacion(): void {
    this.mostrarModal = true;
  }

  /**
   * Cierra el modal de confirmación.
   */
  cerrarModal(): void {
    this.mostrarModal = false;
  }

  /**
   * Procesa la reserva de todas las citas.
   * Envía las citas al backend y maneja la respuesta.
   */
  reservarCitas(): void {
    if (this.citasEnProceso.length === 0) {
      this.mostrarError('Por favor, añada al menos una cita');
      return;
    }

    const citasRequest: CitasRequest = {
      citas: this.citasEnProceso.map(c => c.cita)
    };

    this.citaService.crearCita(citasRequest).subscribe({
      next: (response) => {
        this.mostrarExito('Citas reservadas con éxito');
        this.citaGuardada.emit(response.mensaje);
        this.limpiarFormulario();
        this.citasEnProceso = [];
        this.cerrarModal();

        // Redirigir a la lista de citas con el mensaje de éxito
        this.router.navigate(['/client/citas'], {
          queryParams: { mensaje: 'Citas reservadas con éxito' }
        });
      },
      error: (error) => {
        console.error('Error al reservar las citas:', error);
        this.mostrarError(error.error?.mensaje || 'Error al reservar las citas');
      }
    });
  }

  /**
   * Limpia el formulario completo.
   * Restablece todas las selecciones y estados.
   */
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
