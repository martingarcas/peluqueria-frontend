import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../../../services/auth/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  @Output() switchForm = new EventEmitter<'login' | 'register'>();

  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.errorMessage = ''; // Limpiar mensaje de error anterior

      const { email, password } = this.loginForm.value;

      this.loginService.login(email, password).subscribe({
        next: (response) => {
          console.log('Login exitoso:', response);
          // Obtener el rol del usuario del token
          const loginData = JSON.parse(sessionStorage.getItem('LOGIN') || '{}');
          const role = loginData.user.role?.toLowerCase();

          // Redirigir según el rol
          switch(role) {
            case 'admin':
              this.router.navigate(['/admin']);
              break;
            case 'trabajador':
              this.router.navigate(['/worker']);
              break;
            case 'cliente':
              this.router.navigate(['/client']);
              break;
            default:
              this.router.navigate(['/']);
          }
        },
        error: (error) => {
          console.error('Error en el login:', error);
          // El backend devuelve los errores en la estructura { error: "mensaje" }
          this.errorMessage = error.error.error || 'Error al iniciar sesión';
        }
      });
    }
  }

  setActiveForm(form: 'login' | 'register') {
    this.switchForm.emit(form);
  }
}
