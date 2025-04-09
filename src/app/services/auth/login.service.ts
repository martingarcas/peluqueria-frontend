import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs';
import { LoginRequest } from '../../models/auth/login-request';
import { LoginResponse } from '../../models/auth/login-response';
import { User } from '../../models/auth/user';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private profileSubject = new BehaviorSubject<string | null>(this.getProfileFromStorage());

  token: string;
  profile: string;
  logged: boolean;
  user: User | null;

  constructor(private http: HttpClient) {
    this.token = "";
    this.profile = "";
    this.logged = false;
    this.user = null;
    this.recover();
  }

  private store() {
    const data = {
      token: this.token,
      profile: this.profile,
      logged: this.logged,
      user: this.user
    }
    sessionStorage.setItem("LOGIN", JSON.stringify(data));
    sessionStorage.setItem("token", this.token);
    this.profileSubject.next(this.profile);
  }

  recover() {
    if (sessionStorage.getItem("LOGIN")) {
      const data = sessionStorage.getItem("LOGIN") || "";

      if (data) {
        const obj = JSON.parse(data);
        this.token = obj.token;
        this.profile = obj.profile;
        this.logged = obj.logged;
        this.user = obj.user;
      }
    } else {
      this.logged = false;
      this.token = "";
      this.profile = "";
      this.user = null;
    }

    this.profileSubject.next(this.profile);
  }

  login(email: string, password: string): Observable<any> {
    const loginRequest: LoginRequest = { email, password };

    return this.http.post<LoginResponse>("http://localhost:9000/auth/login", loginRequest)
      .pipe(
        map((response: LoginResponse) => {
          if (response && response.token) {
            this.user = {
              id: 0,
              name: response.name,
              surname: response.surname,
              email: response.email,
              role: response.role,
              phone: "",
              registrationDate: new Date()
            };
            this.profile = response.role.toLowerCase();
            this.token = response.token;
            this.logged = true;
            this.store();
            return { success: true, profile: this.profile };
          }
          return { success: false };
        })
      );
  }

  private clear() {
    sessionStorage.removeItem("LOGIN");
    sessionStorage.removeItem("token");
    this.profile = "";
    this.logged = false;
    this.user = null;
    this.profileSubject.next(null);
  }

  logout() {
    this.clear();
  }

  isLogged(): boolean {
    const data = sessionStorage.getItem("LOGIN");
    return data ? JSON.parse(data).logged : false;
  }

  getName(): string {
    const data = sessionStorage.getItem("LOGIN");
    return data ? JSON.parse(data).user.name : "";
  }

  getProfile(): string {
    const data = sessionStorage.getItem("LOGIN");
    return data ? JSON.parse(data).profile : "";
  }

  private getProfileFromStorage(): string | null {
    const data = sessionStorage.getItem("LOGIN");
    return data ? JSON.parse(data).profile : null;
  }

  get profileObservable() {
    return this.profileSubject.asObservable();
  }
}
