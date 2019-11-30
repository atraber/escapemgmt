/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from './common.module';

import {AppComponent} from './app.component';

import {BookingsService} from './bookings.service';
import {DevicesService} from './devices.service';
import {PresetsService} from './presets.service';
import {ScoresService} from './scores.service';
import {NavService} from './nav.service';

import {RoomsService} from './frontscreen/rooms.service';

import {BookingsModule} from './bookings/bookings.module';
import {DevicesModule} from './devices/devices.module';
import {FrontscreenModule} from './frontscreen/frontscreen.module';
import {RoomsModule} from './rooms/rooms.module';

const appRoutes: Routes = [
  {
    path: 'bookings',
    loadChildren: () => import('./bookings/bookings.module').then(m => m.BookingsModule),
  },
  {
    path: 'devices',
    loadChildren: () => import('./devices/devices.module').then(m => m.DevicesModule),
  },
  {
    path: 'rooms',
    loadChildren: () => import('./rooms/rooms.module').then(m => m.RoomsModule),
  },
  { path: '',
    redirectTo: '/bookings/dash',
    pathMatch: 'full'
  },
  { path: '**',
    redirectTo: '/bookings/dash',
    pathMatch: 'full'
  },
];

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    CommonModule,
    BookingsModule,
    DevicesModule,
    FrontscreenModule,
    RoomsModule,
    RouterModule.forRoot(appRoutes),
  ],
  providers: [
    BookingsService,
    DevicesService,
    PresetsService,
    RoomsService,
    ScoresService,
    NavService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
