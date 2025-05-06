import { Routes } from '@angular/router';

// Rutas públicas
import { PublicComponent } from './components/public/public.component';
import { HomeComponent as PublicHomeComponent } from './components/public/home/home.component';

// Autenticación
import { AuthContainerComponent } from './components/auth/auth-container/auth-container.component';

// Cliente
import { ClientComponent } from './components/client/client.component';
import { HomeComponent as ClientHomeComponent } from './components/client/home/home.component';
//import { ProfileComponent } from './components/client/profile/profile.component';
//import { AppointmentsComponent } from './components/client/appointments/appointments.component';

// Admin
import { AdminComponent } from './components/admin/admin.component';
import { HomeComponent as AdminHomeComponent } from './components/admin/home/home.component';
import { HeaderComponent as AdminHeaderComponent } from './components/admin/header/header.component';
import { FooterComponent as AdminFooterComponent } from './components/admin/footer/footer.component';
import { ListaCategoriasComponent } from './components/admin/categorias/lista-categorias/lista-categorias.component';
import { ListaProductosComponent } from './components/admin/productos/lista-productos/lista-productos.component';
import { ListaServiciosComponent } from './components/admin/servicios/lista-servicios/lista-servicios.component';
//import { UsersComponent } from './components/admin/users/users.component';
//import { ServicesComponent } from './components/admin/services/services.component';
//import { AppointmentsComponent as AdminAppointmentsComponent } from './components/admin/appointments/appointments.component';
//import { CategoriesComponent } from './components/admin/categories/categories.component';
//import { ProductsComponent } from './components/admin/products/products.component';
//import { OrdersComponent } from './components/admin/orders/orders.component';
//import { SchedulesComponent } from './components/admin/schedules/schedules.component';

// Otros
import { TestImageComponent } from './components/test-image/test-image.component';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { ClienteGuard } from './guards/cliente.guard';
import { AdminGuard } from './guards/admin.guard';
import { TrabajadorGuard } from './guards/trabajador.guard';
// futuros guards: workerGuard

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
      //{ path: 'profile', component: ProfileComponent },
      //{ path: 'appointments', component: AppointmentsComponent }
    ]
  },

  // Layout admin
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: '', component: AdminHomeComponent },
      { path: 'categorias', component: ListaCategoriasComponent },
      { path: 'productos', component: ListaProductosComponent },
      { path: 'servicios', component: ListaServiciosComponent },
      //{ path: 'usuarios', component: UsersComponent },
      //{ path: 'servicios', component: ServicesComponent },
      //{ path: 'citas', component: AdminAppointmentsComponent },
      //{ path: 'categorias', component: CategoriesComponent },
      //{ path: 'productos', component: ProductsComponent },
      //{ path: 'pedidos', component: OrdersComponent },
      //{ path: 'horarios', component: SchedulesComponent }
    ]
  },

  // Ruta protegida de test
  { path: 'test-image', component: TestImageComponent, canActivate: [AuthGuard] },

  // Ruta por defecto (página no encontrada)
  { path: '**', redirectTo: '' }
];
