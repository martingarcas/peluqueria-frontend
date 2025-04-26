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
    // Simplemente retornamos el error tal cual para que sea consistente con el login
    return throwError(() => error);
  }
}
