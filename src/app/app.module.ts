import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { routes } from './app.routes';
import { AppComponent } from './app.component';
import { PublicComponent } from './components/public/public.component';
import { HeaderComponent as PublicHeaderComponent } from './components/public/header/header.component';
import { FooterComponent as PublicFooterComponent } from './components/public/footer/footer.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { AuthContainerComponent } from './components/auth/auth-container/auth-container.component';
import { TestImageComponent } from './components/test-image/test-image.component';
import { HomeComponent } from './components/client/home/home.component';
import { ClientComponent } from './components/client/client.component';
import { HeaderComponent as ClientHeaderComponent} from './components/client/header/header.component';
import { FooterComponent as ClientFooterComponent} from './components/client/footer/footer.component';
import { AdminComponent } from './components/admin/admin.component';
import { HeaderComponent as AdminHeaderComponent } from './components/admin/header/header.component';
import { FooterComponent as AdminFooterComponent } from './components/admin/footer/footer.component';
import { ListaCategoriasComponent } from './components/admin/categorias/lista-categorias/lista-categorias.component';
import { FormCategoriaComponent } from './components/admin/categorias/form-categoria/form-categoria.component';
import { ListaProductosComponent } from './components/admin/productos/lista-productos/lista-productos.component';
import { FormProductoComponent } from './components/admin/productos/form-producto/form-producto.component';
import { ListaServiciosComponent } from './components/admin/servicios/lista-servicios/lista-servicios.component';
import { FormServicioComponent } from './components/admin/servicios/form-servicio/form-servicio.component';
import { ListaHorariosComponent } from './components/admin/horarios/lista-horarios/lista-horarios.component';
import { FormHorarioComponent } from './components/admin/horarios/form-horario/form-horario.component';
import { FormUsuarioComponent } from './components/admin/usuarios/form-usuario/form-usuario.component';
import { ListaUsuariosComponent } from './components/admin/usuarios/lista-usuarios/lista-usuarios.component';
import { ListaCitasComponent } from './components/client/citas/lista-citas/lista-citas.component';
import { FormCitaComponent } from './components/client/citas/form-cita/form-cita.component';

@NgModule({
  declarations: [
    AppComponent,
    PublicComponent,
    PublicHeaderComponent,
    PublicFooterComponent,
    LoginComponent,
    RegisterComponent,
    AuthContainerComponent,
    TestImageComponent,
    HomeComponent,
    ClientComponent,
    ClientHeaderComponent,
    ClientFooterComponent,
    AdminComponent,
    AdminHeaderComponent,
    AdminFooterComponent,
    ListaCategoriasComponent,
    FormCategoriaComponent,
    ListaProductosComponent,
    FormProductoComponent,
    ListaServiciosComponent,
    FormServicioComponent,
    ListaHorariosComponent,
    FormHorarioComponent,
    FormUsuarioComponent,
    ListaUsuariosComponent,
    ListaCitasComponent,
    FormCitaComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    CommonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
