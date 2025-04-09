import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { HomeComponent as PublicHomeComponent } from './components/public/home/home.component';
import { HomeComponent as ClientHomeComponent } from './components/client/home/home.component';

/* Estos serán los componentes futuros
import { AdminComponent } from './components/admin/home/home.component';
import { WorkerComponent } from './components/worker/home/home.component';
import { WorkerListComponent } from './components/admin/worker-list/worker-list.component';
import { ServiceListComponent } from './components/admin/service-list/service-list.component';
import { ProductListComponent } from './components/admin/product-list/product-list.component';
import { AppointmentListComponent } from './components/worker/appointment-list/appointment-list.component';
import { ScheduleComponent } from './components/worker/schedule/schedule.component';
import { ClientAppointmentsComponent } from './components/client/appointments/appointments.component';
*/

/* Estos serán los guards futuros
import { adminGuard } from './guards/admin.guard';
import { workerGuard } from './guards/worker.guard';
import { clientGuard } from './guards/client.guard';
*/

export const routes: Routes = [
    // Rutas públicas
    { path: '', component: PublicHomeComponent, pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },

    // Rutas de cliente
    {
        path: 'client',
        component: ClientHomeComponent,
        // canActivate: [clientGuard], // Se añadirá cuando creemos el guard
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'home', component: ClientHomeComponent }
        ]
    },

    /* Rutas futuras de administrador
    {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
            { path: '', component: AdminComponent },
            { path: 'workers', component: WorkerListComponent },
            { path: 'services', component: ServiceListComponent },
            { path: 'products', component: ProductListComponent }
        ]
    },
    */

    /* Rutas futuras de trabajador
    {
        path: 'worker',
        canActivate: [workerGuard],
        children: [
            { path: '', component: WorkerComponent },
            { path: 'appointments', component: AppointmentListComponent },
            { path: 'schedule', component: ScheduleComponent }
        ]
    },
    */

    // Ruta para páginas no encontradas
    { path: '**', redirectTo: '' }
];
