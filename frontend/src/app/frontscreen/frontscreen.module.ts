/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule, Routes} from '@angular/router';

import {CommonModule} from '../common.module';

import {FrontscreenComponent} from './frontscreen.component';
import {HighscoreComponent} from './highscore.component';
import {RoomsService} from './rooms.service';
import {RoomSlideComponent} from './roomslide.component';
import {SlideComponent} from './slide.component';
import {SlideContainerComponent} from './slidecontainer.component';

const routes: Routes = [
  {
    path : 'frontscreen',
    component : FrontscreenComponent,
  },
];

@NgModule({
  declarations : [
    FrontscreenComponent,
    HighscoreComponent,
    RoomSlideComponent,
    SlideComponent,
    SlideContainerComponent,
  ],
  entryComponents : [],
  imports : [
    CommonModule,
    BrowserAnimationsModule,
    RouterModule.forChild(routes),
  ],
  exports : [
    RouterModule,
    FrontscreenComponent,
  ],
  providers : [
    RoomsService,
  ]
})
export class FrontscreenModule {
}
