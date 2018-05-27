import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MomentModule } from 'angular2-moment';

import { AppComponent } from './app.component';
import { DevicesComponent } from './devices.component';
import { StreamsComponent } from './streams.component';
import { ScoresComponent } from './scores.component';
import { RoomsComponent } from './rooms.component';

import { DevicesService } from './devices.service';
import { ScoresService } from './scores.service';

const appRoutes: Routes = [
  { path: 'devices', component: DevicesComponent },
  { path: 'streams', component: StreamsComponent },
  { path: 'scores', component: ScoresComponent },
  { path: 'rooms', component: RoomsComponent },
  { path: '',
    redirectTo: '/devices',
    pathMatch: 'full'
  },
  { path: '**',
    redirectTo: '/devices',
    pathMatch: 'full'
  },
];

@NgModule({
  declarations: [
    AppComponent,
    DevicesComponent,
    RoomsComponent,
    ScoresComponent,
    StreamsComponent,
  ],
  imports: [
    RouterModule.forRoot(
      appRoutes
    ),
    FormsModule,
    BrowserModule,
    HttpClientModule,
    MomentModule,
  ],
  providers: [
    DevicesService,
    ScoresService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
