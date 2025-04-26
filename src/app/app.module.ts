import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

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
    AdminFooterComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
