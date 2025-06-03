import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CitaResponse } from 'src/app/models/citas/cita-response';
import { CitaRequest, CitasRequest, ReasignacionRequest } from 'src/app/models/citas/cita-request';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrl = 'http://localhost:9000/api/citas';

  constructor(private http: HttpClient) {}

  private obtenerHeaders(): HttpHeaders {
    const storedLogin = sessionStorage.getItem('LOGIN');
    let token = '';

    if (storedLogin) {
      const loginData = JSON.parse(storedLogin);
      token = loginData.token || '';
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  obtenerCitas(): Observable<{ mensaje: string, citas: any }> {
    return this.http.get<{ mensaje: string, citas: any }>(
      `${this.apiUrl}/todas`,
      { headers: this.obtenerHeaders() }
    );
  }

  obtenerCitasUsuario(): Observable<{ mensaje: string, citas: CitaResponse[] }> {
    return this.http.get<{ mensaje: string, citas: CitaResponse[] }>(
      this.apiUrl,
      { headers: this.obtenerHeaders() }
    );
  }

  crearCita(citas: CitasRequest): Observable<{ mensaje: string, citas: CitaResponse[] }> {
    return this.http.post<{ mensaje: string, citas: CitaResponse[] }>(
      this.apiUrl,
      citas,
      { headers: this.obtenerHeaders() }
    );
  }

  actualizarEstadoCita(id: number, estado: string): Observable<{ mensaje: string, cita: CitaResponse }> {
    return this.http.put<{ mensaje: string, cita: CitaResponse }>(
      `${this.apiUrl}/${id}/estado`,
      null,
      {
        headers: this.obtenerHeaders(),
        params: new HttpParams().set('estado', estado)
      }
    );
  }

  obtenerDisponibilidad(trabajadorId: number, servicioId: number, fecha: string): Observable<any> {
    const params = new HttpParams()
      .set('trabajadorId', trabajadorId.toString())
      .set('servicioId', servicioId.toString())
      .set('fecha', fecha);

    return this.http.get<any>(
      `${this.apiUrl}/disponibilidad`,
      { headers: this.obtenerHeaders(), params }
    );
  }

  obtenerTrabajadoresNoDisponibles(servicioId: number, fecha: string, hora: string): Observable<any> {
    const params = new HttpParams()
      .set('servicioId', servicioId.toString())
      .set('fecha', fecha)
      .set('hora', hora);

    return this.http.get<any>(
      `${this.apiUrl}/trabajadores-no-disponibles`,
      { headers: this.obtenerHeaders(), params }
    );
  }

  obtenerDiasNoDisponibles(servicioId: number, hora: string, fechaInicio: string, fechaFin: string): Observable<any> {
    const params = new HttpParams()
      .set('servicioId', servicioId.toString())
      .set('hora', hora)
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<any>(
      `${this.apiUrl}/dias-no-disponibles`,
      { headers: this.obtenerHeaders(), params }
    );
  }

  obtenerTrabajadoresDisponibles(servicioId: number): Observable<any> {
    const params = new HttpParams().set('servicioId', servicioId.toString());

    return this.http.get<any>(
      `${this.apiUrl}/trabajadores-disponibles`,
      { headers: this.obtenerHeaders(), params }
    );
  }

  obtenerCitasPorCliente(clienteId: number): Observable<{ mensaje: string, citas: CitaResponse[] }> {
    return this.http.get<{ mensaje: string, citas: CitaResponse[] }>(
      `${this.apiUrl}/cliente/${clienteId}`,
      { headers: this.obtenerHeaders() }
    );
  }

  obtenerCitasPorTrabajador(trabajadorId: number): Observable<{ mensaje: string, citas: CitaResponse[] }> {
    return this.http.get<{ mensaje: string, citas: CitaResponse[] }>(
      `${this.apiUrl}/trabajador/${trabajadorId}`,
      { headers: this.obtenerHeaders() }
    );
  }

  reasignarCita(id: number, reasignacion: ReasignacionRequest): Observable<{ mensaje: string, cita: CitaResponse }> {
    return this.http.put<{ mensaje: string, cita: CitaResponse }>(
      `${this.apiUrl}/${id}/reasignar`,
      reasignacion,
      { headers: this.obtenerHeaders() }
    );
  }

  obtenerDiasDisponibles(servicioId: number, fechaInicio: string, fechaFin: string): Observable<any> {
    const params = new HttpParams()
      .set('servicioId', servicioId.toString())
      .set('hora', '00:00') // Usamos una hora que nunca tendrá citas
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<any>(
      `${this.apiUrl}/dias-no-disponibles`,
      { headers: this.obtenerHeaders(), params }
    ).pipe(
      map(response => {
        // Invertimos la lógica: convertimos días no disponibles en disponibles
        const todosLosDias = this.obtenerTodosLosDiasDelMes(new Date(fechaInicio), new Date(fechaFin));
        const diasDisponibles = todosLosDias.filter(dia => !response.diasNoDisponibles.includes(dia));
        return { diasDisponibles };
      })
    );
  }

  private obtenerTodosLosDiasDelMes(fechaInicio: Date, fechaFin: Date): string[] {
    const dias: string[] = [];
    const fechaActual = new Date(fechaInicio);
    fechaActual.setHours(0, 0, 0, 0); // Normalizar la hora a inicio del día

    const fechaFinNormalizada = new Date(fechaFin);
    fechaFinNormalizada.setHours(23, 59, 59, 999); // Normalizar la hora a fin del día

    while (fechaActual <= fechaFinNormalizada) {
      dias.push(fechaActual.toISOString().split('T')[0]);
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return dias;
  }
}
