import { Injectable } from '@angular/core';
import { LoginService } from './login.service';
import { RegisterService } from './register.service';
import { Observable } from 'rxjs';
import { RegisterRequest } from '../../models/auth/register-request';
import { RegisterResponse } from '../../models/auth/register-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private loginService: LoginService,
    private registerService: RegisterService
  ) { }

  // Public registration method (always as client)
  publicRegister(user: RegisterRequest): Observable<RegisterResponse> {
    // Ensure the role is 'client'
    const clientUser: RegisterRequest = {
      ...user,
      role: 'client'  // Force client role
    };
    return this.registerService.register(clientUser);
  }

  // Admin registration method (allows role specification)
  adminRegister(user: RegisterRequest): Observable<RegisterResponse> {
    // We use the role that comes in the request
    return this.registerService.register(user);
  }

  login(email: string, password: string) {
    return this.loginService.login(email, password);
  }

  logout() {
    this.loginService.logout();
  }

  isLogged(): boolean {
    return this.loginService.isLogged();
  }

  getProfile(): string {
    return this.loginService.getProfile();
  }

  get profileObservable() {
    return this.loginService.profileObservable;
  }
}
