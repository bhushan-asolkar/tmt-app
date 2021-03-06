import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { MenuBarComponent } from './header/menu-bar/menu-bar.component';
import { TMTPrimengModule } from './shared/tmtprimeng.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HomeModule } from './home/home.module';
import { DropdownDirective } from './shared/directives/dropdown.directive';
import { LoginComponent } from './login/login.component';
import { HttpInterceptorService } from './services/http/http-interceptor.service';
import { BaseService } from './services/base.service';
import { AlertComponent } from './alert/alert.component';
import { AppSharedService } from './services/app-shared.service';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { ToasterComponent } from './shared/toaster/toaster.component';
import { SrcaRoleDirective } from './directives/srca-role.directive';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    DropdownDirective,
    MenuBarComponent,
    LoginComponent,
    AlertComponent,
    SpinnerComponent,
    ToasterComponent,
    SrcaRoleDirective
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    TMTPrimengModule,
    ReactiveFormsModule,
    HttpClientModule,
    HomeModule,
    AppRoutingModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true },
    BaseService,
    AppSharedService
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }
