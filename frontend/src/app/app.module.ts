/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from './common.module';

import {AppComponent} from './app.component';

import {DevicesService} from './devices.service';
import {PresetsService} from './presets.service';
import {ScoresService} from './scores.service';

// import {FrontscreenComponent} from './frontscreen/frontscreen.component';
// import {HighscoreComponent} from './frontscreen/highscore.component';
import {RoomsService} from './frontscreen/rooms.service';

import {DevicesModule} from './devices/devices.module';
import {RoomsModule} from './rooms/rooms.module';

const appRoutes: Routes = [
  {
    path: 'devices',
    loadChildren: './devices/devices.module#DevicesModule',
  },
  {
    path: 'rooms',
    loadChildren: './rooms/rooms.module#RoomsModule',
  },
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
  ],
  imports: [
    RouterModule.forRoot(
      appRoutes
    ),
    RoomsModule,
    DevicesModule,
    CommonModule,
  ],
  providers: [
    DevicesService,
    PresetsService,
    RoomsService,
    ScoresService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
