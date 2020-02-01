/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule, Routes} from '@angular/router';

import {AppComponent} from './app.component';
import {BookingsService, bookingsServiceProvider} from './bookings.service';
import {BookingsModule} from './bookings/bookings.module';
import {CommonModule} from './common.module';
import {DevicesService, devicesServiceProvider} from './devices.service';
import {DevicesModule} from './devices/devices.module';
import {FrontscreenModule} from './frontscreen/frontscreen.module';
import {RoomsService} from './frontscreen/rooms.service';
import {NavService, navServiceProvider} from './nav.service';
import {PresetsService, presetsServiceProvider} from './presets.service';
import {RoomsModule} from './rooms/rooms.module';
import {ScoresService, scoresServiceProvider} from './scores.service';

const appRoutes: Routes = [
  {
    path : 'bookings',
    loadChildren : () =>
        import('./bookings/bookings.module').then(m => m.BookingsModule),
  },
  {
    path : 'devices',
    loadChildren : () =>
        import('./devices/devices.module').then(m => m.DevicesModule),
  },
  {
    path : 'rooms',
    loadChildren : () =>
        import('./rooms/rooms.module').then(m => m.RoomsModule),
  },
  {path : '', redirectTo : '/bookings/dash', pathMatch : 'full'},
  {path : '**', redirectTo : '/bookings/dash', pathMatch : 'full'},
];

@NgModule({
  declarations : [
    AppComponent,
  ],
  imports : [
    BrowserModule,
    CommonModule,
    BookingsModule,
    DevicesModule,
    FrontscreenModule,
    RoomsModule,
    RouterModule.forRoot(appRoutes),
  ],
  providers : [
    navServiceProvider,
    devicesServiceProvider,
    presetsServiceProvider,
    RoomsService,
    scoresServiceProvider,
    bookingsServiceProvider,
  ],
  bootstrap : [ AppComponent ]
})
export class AppModule {
}
