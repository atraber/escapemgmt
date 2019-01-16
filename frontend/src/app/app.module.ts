/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
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
import { PresetsService } from './presets.service';
import { ScoresService } from './scores.service';

import { FrontscreenComponent } from './frontscreen/frontscreen.component';
import { HighscoreComponent } from './frontscreen/highscore.component';
import { RoomsService } from './frontscreen/rooms.service';
import { PresetsComponent } from './presets.component';

const appRoutes: Routes = [
  { path: 'devices', component: DevicesComponent },
  { path: 'frontscreen', component: FrontscreenComponent },
  { path: 'presets', component: PresetsComponent },
  { path: 'rooms', component: RoomsComponent },
  { path: 'scores', component: ScoresComponent },
  { path: 'streams', component: StreamsComponent },
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
    FrontscreenComponent,
    HighscoreComponent,
    PresetsComponent,
    RoomsComponent,
    ScoresComponent,
    StreamsComponent,
  ],
  imports: [
    RouterModule.forRoot(
      appRoutes
    ),
    BrowserModule,
    FormsModule,
    HttpClientModule,
    MomentModule,
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
