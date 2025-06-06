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
    private formBuilder: FormBuilder,
    private registerService: RegisterService
  ) {
    this.registerForm = this.formBuilder.group({
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
          this.successMessage = response.mensaje || '¡Registro exitoso! Redirigiendo al login...';
          this.registerForm.reset();
          setTimeout(() => {
            this.setActiveForm('login');
          }, 2000);
        },
        error: (error) => {
          console.error('Error en el registro', error);
          if (error.error) {
            if (error.error.errores) {
              // Asignar errores a campos específicos
              Object.entries(error.error.errores).forEach(([key, value]) => {
                // Marcar el campo como touched para que se muestren los errores
                const control = this.registerForm.get(key);
                if (control) {
                  control.setErrors({ serverError: value });
                  control.markAsTouched();
                }
              });
            } else {
              this.errorMessage = error.error.mensaje || 'Error en el registro';
            }
          } else {
            this.errorMessage = 'Error en el registro';
          }
        }
      });
    }
  }

  passwordMatchValidator(registroForm: FormGroup) {
    return registroForm.get('password')?.value === registroForm.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  setActiveForm(form: 'login' | 'register') {
    this.switchForm.emit(form);
  }
}
