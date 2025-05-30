import { Routes } from '@angular/router';

// Rutas públicas
import { PublicComponent } from './components/public/public.component';
import { HomeComponent as PublicHomeComponent } from './components/public/home/home.component';

// Autenticación
import { AuthContainerComponent } from './components/auth/auth-container/auth-container.component';

// Cliente
import { ClientComponent } from './components/client/client.component';
import { HomeComponent as ClientHomeComponent } from './components/client/home/home.component';
import { ListaServiciosComponent as ClientListaServiciosComponent } from './components/client/servicios/lista-servicios/lista-servicios.component';
import { ListaProductosComponent as ClientListaProductosComponent } from './components/client/tienda/lista-productos/lista-productos.component';
import { CarritoComponent } from './components/client/tienda/carrito/carrito.component';
import { ListaCitasComponent as ClientListaCitasComponent } from './components/client/citas/lista-citas/lista-citas.component';
import { PerfilComponent as ClientPerfilComponent } from './components/client/perfil/perfil.component';
import { ListaPedidosComponent as ClientListaPedidosComponent } from './components/client/pedidos/lista-pedidos/lista-pedidos.component';
// Admin
import { AdminComponent } from './components/admin/admin.component';
import { HomeComponent as AdminHomeComponent } from './components/admin/home/home.component';
import { ListaCategoriasComponent } from './components/admin/categorias/lista-categorias/lista-categorias.component';
import { ListaProductosComponent } from './components/admin/productos/lista-productos/lista-productos.component';
import { ListaServiciosComponent } from './components/admin/servicios/lista-servicios/lista-servicios.component';
import { ListaHorariosComponent } from './components/admin/horarios/lista-horarios/lista-horarios.component';
import { ListaUsuariosComponent } from './components/admin/usuarios/lista-usuarios/lista-usuarios.component';

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
      { path: 'citas', component: ClientListaCitasComponent },
      { path: 'servicios', component: ClientListaServiciosComponent },
      { path: 'productos', component: ClientListaProductosComponent },
      { path: 'carrito', component: CarritoComponent },
      { path: 'perfil', component: ClientPerfilComponent },
      { path: 'pedidos', component: ClientListaPedidosComponent },
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
      { path: 'horarios', component: ListaHorariosComponent },
      { path: 'usuarios', component: ListaUsuariosComponent },
      //{ path: 'citas', component: AdminAppointmentsComponent },
    ]
  },

  // Ruta protegida de test
  { path: 'test-image', component: TestImageComponent, canActivate: [AuthGuard] },

  // Ruta por defecto (página no encontrada)
  { path: '**', redirectTo: '' }
];
