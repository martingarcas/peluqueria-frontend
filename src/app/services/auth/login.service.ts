import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest } from '../../models/auth/login-request';
import { LoginResponse } from '../../models/auth/login-response';
import { User } from '../../models/auth/user';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'http://localhost:9000';
  private profileSubject = new BehaviorSubject<string | null>(this.getProfileFromStorage());
  private userSubject = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {
    this.recover();
  }

  private store(loginData: any) {
    // Guardamos datos esenciales incluyendo el email
    const essentialData = {
      token: loginData.token,
      profile: loginData.profile,
      user: {
        id: loginData.user.id,
        email: loginData.user.email,
        nombre: loginData.user.nombre,
        role: loginData.user.role,
        fotoThumbnail: loginData.user.fotoThumbnail // Thumbnail pequeño para avatar
      }
    };
    sessionStorage.setItem("LOGIN", JSON.stringify(essentialData));
    this.profileSubject.next(loginData.profile);
    this.userSubject.next(loginData.user);
  }

  recover() {
    const data = sessionStorage.getItem("LOGIN");
    if (data) {
      const parsed = JSON.parse(data);
      this.profileSubject.next(parsed.profile);
      this.userSubject.next(parsed.user);
    } else {
      this.profileSubject.next(null);
      this.userSubject.next(null);
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((response: any) => {
          // Adaptamos la respuesta del backend a nuestra estructura
          const userData = response.data;
          const loginData = {
            token: userData.token,
            profile: userData.role,
            user: {
              id: userData.id || null,
              email: userData.email,
              nombre: userData.nombre,
              apellidos: userData.apellidos,
              role: userData.role,
              direccion: userData.direccion,
              telefono: userData.telefono,
              fotoUrl: userData.foto,
              fotoThumbnail: userData.foto
            }
          };

          // Guardamos los datos completos en el BehaviorSubject
          this.userSubject.next(loginData.user);
          // Pero en sessionStorage solo los esenciales
          this.store(loginData);
        })
      );
  }

  logout(): void {
    sessionStorage.removeItem('LOGIN');
    this.profileSubject.next(null);
    this.userSubject.next(null);
  }

  isLoggedIn(): boolean {
    return sessionStorage.getItem('LOGIN') !== null;
  }

  getToken(): string | null {
    const data = sessionStorage.getItem('LOGIN');
    return data ? JSON.parse(data).token : null;
  }

  // Observable para datos del usuario
  get user$(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  // Observable para el perfil
  get profile$(): Observable<string | null> {
    return this.profileSubject.asObservable();
  }

  // Método para obtener datos completos del usuario
  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/profile`);
  }

  // Método para subir foto de usuario
  uploadUserPhoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/users/photo`, formData);
  }

  private getProfileFromStorage(): string | null {
    const data = sessionStorage.getItem("LOGIN");
    return data ? JSON.parse(data).profile : null;
  }
}
