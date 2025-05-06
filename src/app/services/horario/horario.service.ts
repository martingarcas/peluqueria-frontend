import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorarioResponse } from '../../models/horarios/horario-response';
import { HorarioRequest } from '../../models/horarios/horario-request';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  private apiUrl = 'http://localhost:9000/api/horarios';

  constructor(private http: HttpClient) { }

  private obtenerHeaders(isMultipart: boolean = false): HttpHeaders {
    const storedLogin = sessionStorage.getItem('LOGIN');
    let token = '';

    if (storedLogin) {
      const loginData = JSON.parse(storedLogin);
      token = loginData.token || '';
    }

    if (isMultipart) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  obtenerTodos(): Observable<{ mensaje: string, horarios: HorarioResponse[] }> {
    return this.http.get<{ mensaje: string, horarios: HorarioResponse[] }>(
      this.apiUrl,
      { headers: this.obtenerHeaders() }
    );
  }

  obtenerPorId(id: number): Observable<{ mensaje: string, horario: HorarioResponse }> {
    return this.http.get<{ mensaje: string, horario: HorarioResponse }>(
      `${this.apiUrl}/${id}`,
      { headers: this.obtenerHeaders() }
    );
  }

  crear(horario: HorarioRequest): Observable<{ mensaje: string, horario: HorarioResponse }> {
    return this.http.post<{ mensaje: string, horario: HorarioResponse }>(
      this.apiUrl,
      horario,
      { headers: this.obtenerHeaders() }
    );
  }

  actualizar(id: number, horario: HorarioRequest): Observable<{ mensaje: string, horario: HorarioResponse }> {
    return this.http.put<{ mensaje: string, horario: HorarioResponse }>(
      `${this.apiUrl}/${id}`,
      horario,
      { headers: this.obtenerHeaders() }
    );
  }

  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.apiUrl}/${id}`,
      { headers: this.obtenerHeaders() }
    );
  }
}
