import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegisterService } from '../../../services/auth/register.service';
import { RegisterRequest } from '../../../models/auth/register-request';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  @Output() switchForm = new EventEmitter<'login' | 'register'>();

  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  private passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  private emailPattern = /^[A-Za-z0-9+_.-]+@(.+)$/;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(this.emailPattern)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(this.passwordPattern)
      ]],
      confirmPassword: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      direccion: ['']
    }, {
      validator: this.passwordMatchValidator
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.errorMessage = '';
      this.successMessage = '';

      const request = {
        ...this.registerForm.value,
        role: 'CLIENTE'
      };
      delete request.confirmPassword;

      this.registerService.register(request).subscribe({
        next: (response) => {
          console.log('Registro exitoso', response);
          this.successMessage = '¡Registro exitoso! Redirigiendo al login...';
          this.registerForm.reset();
          setTimeout(() => {
            this.setActiveForm('login');
          }, 2000);
        },
        error: (error) => {
          console.error('Error en el registro', error);
          this.errorMessage = error;
        }
      });
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  setActiveForm(form: 'login' | 'register') {
    this.switchForm.emit(form);
  }
}
