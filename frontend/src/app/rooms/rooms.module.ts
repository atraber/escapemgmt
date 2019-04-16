/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from '../common.module';

import {RoomsRootComponent} from './root.component';
import {RoomsComponent, RoomsDeleteDialog} from './rooms.component';
import {RoomCreateComponent} from './create.component';

import {ScoresComponent} from './scores.component';

const routes: Routes = [
  {
    path: 'rooms',
    component: RoomsRootComponent,
    children: [
      { path: '', component: RoomsComponent },
      { path: 'new', component: RoomCreateComponent },
    ]
  },
  {
    path: 'scores',
    component: RoomsRootComponent,
    children: [
      { path: '', component: ScoresComponent },
    ],
  }
];

@NgModule({
  declarations: [
    RoomsRootComponent,
    RoomsComponent,
    RoomsDeleteDialog,
    RoomCreateComponent,
    ScoresComponent,
  ],
  entryComponents: [
    RoomsDeleteDialog,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  exports: [
    RouterModule
  ]
})
export class RoomsModule { }
