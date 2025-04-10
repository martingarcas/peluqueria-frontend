import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RegisterRequest } from '../../models/auth/register-request';
import { RegisterResponse } from '../../models/auth/register-response';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private apiUrl = 'http://localhost:9000';

  constructor(private http: HttpClient) { }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/auth/check-email/${email}`);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error en el registro';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = error.error.message;
    } else {
      // Error del backend
      if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.error) {
        // Si hay errores de validación
        const validationErrors = error.error;
        const errors = [];
        for (const key in validationErrors) {
          if (validationErrors.hasOwnProperty(key)) {
            errors.push(validationErrors[key]);
          }
        }
        errorMessage = errors.join('. ');
      }
    }

    return throwError(() => errorMessage);
  }
}
