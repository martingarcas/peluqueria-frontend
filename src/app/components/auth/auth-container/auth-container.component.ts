import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-container',
  templateUrl: './auth-container.component.html',
  styleUrls: ['./auth-container.component.css']
})
export class AuthContainerComponent {
  activeForm: 'login' | 'register' = 'login';

  setActiveForm(form: 'login' | 'register'): void {
    this.activeForm = form;
  }
}
