import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FootballComponent } from './football/football.component';
import { OfficeComponent } from './office/office.component';
import { TableTennisComponent } from './table-tennis/table-tennis.component';
import { TvRoomComponent } from './tv-room/tv-room.component';

const routes: Routes = [
  {
    path: 'tabletennis',
    component: TableTennisComponent
  },
  {
    path: 'football',
    component: FootballComponent
  },
  {
    path: 'home-office',
    component: OfficeComponent
  },
  {
    path: 'tv-room',
    component: TvRoomComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
