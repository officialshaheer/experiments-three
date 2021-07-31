import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { TableTennisComponent } from './table-tennis/table-tennis.component';
import { FootballComponent } from './football/football.component';
import { OfficeComponent } from './office/office.component';
import { TvRoomComponent } from './tv-room/tv-room.component';
import { DashboardComponent } from './dashboard/dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    TableTennisComponent,
    FootballComponent,
    OfficeComponent,
    TvRoomComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
