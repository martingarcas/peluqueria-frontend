import { Routes } from '@angular/router';

// Rutas públicas
import { PublicComponent } from './components/public/public.component';
import { HomeComponent as PublicHomeComponent } from './components/public/home/home.component';

// Autenticación
import { AuthContainerComponent } from './components/auth/auth-container/auth-container.component';

// Cliente
import { ClientComponent } from './components/client/client.component';
import { HomeComponent as ClientHomeComponent } from './components/client/home/home.component';

// Otros
import { TestImageComponent } from './components/test-image/test-image.component';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { ClienteGuard } from './guards/cliente.guard';
// futuros guards: adminGuard, workerGuard

export const routes: Routes = [
  // Layout público
  {
    path: '',
    component: PublicComponent,
    children: [
      { path: '', component: PublicHomeComponent },
      { path: 'auth', component: AuthContainerComponent },
      { path: 'login', redirectTo: 'auth', pathMatch: 'full' },
      { path: 'register', redirectTo: 'auth', pathMatch: 'full' }
    ]
  },

  // Layout cliente
  {
    path: 'client',
    component: ClientComponent,
    canActivate: [AuthGuard, ClienteGuard],
    children: [
      { path: '', component: ClientHomeComponent },
    ]
  },

  // Ruta protegida de test
  { path: 'test-image', component: TestImageComponent, canActivate: [AuthGuard] },

  // Ruta por defecto (página no encontrada)
  { path: '**', redirectTo: '' }
];
