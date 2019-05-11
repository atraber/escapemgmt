/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from '../common.module';
import {MatCarouselModule} from '@ngmodule/material-carousel';

import {FrontscreenComponent} from './frontscreen.component';
import {HighscoreComponent} from './highscore.component';

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
  ],
  entryComponents: [
  ],
  imports: [
    CommonModule,
    MatCarouselModule,
    RouterModule.forChild(routes),
  ],
  exports: [
    RouterModule,
    FrontscreenComponent,
  ]
})
export class FrontscreenModule { }
