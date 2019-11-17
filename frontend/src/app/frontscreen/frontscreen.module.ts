/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from '../common.module';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {FrontscreenComponent} from './frontscreen.component';
import {HighscoreComponent} from './highscore.component';
import {RoomSlideComponent} from './roomslide.component';
import {SlideComponent} from './slide.component';
import {SlideContainerComponent} from './slidecontainer.component';

const routes: Routes = [
  {
    path: 'frontscreen',
    component: FrontscreenComponent,
  },
];

@NgModule({
  declarations: [
    FrontscreenComponent,
    HighscoreComponent,
    RoomSlideComponent,
    SlideComponent,
    SlideContainerComponent,
  ],
  entryComponents: [
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forChild(routes),
  ],
  exports: [
    RouterModule,
    FrontscreenComponent,
  ]
})
export class FrontscreenModule { }
