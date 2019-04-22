/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from '../common.module';

import {RoomsRootComponent} from './root.component';
import {RoomsComponent, RoomsDeleteDialog} from './rooms.component';
import {RoomCreateDialog} from './create.dialog';
import {ScoresComponent, ScoreAddDialog, ScoreEditDialog, ScoreDeleteDialog} from './scores.component';
import {TimeInput} from './timeinput.component';

const routes: Routes = [
  {
    path: 'rooms',
    component: RoomsRootComponent,
    children: [
      { path: '', component: RoomsComponent },
      { path: 'scores', component: ScoresComponent },
    ]
  },
];

@NgModule({
  declarations: [
    RoomsRootComponent,
    RoomsComponent,
    RoomsDeleteDialog,
    RoomCreateDialog,
    ScoresComponent,
    ScoreAddDialog,
    ScoreEditDialog,
    ScoreDeleteDialog,
    TimeInput,
  ],
  entryComponents: [
    RoomCreateDialog,
    RoomsDeleteDialog,
    ScoreAddDialog,
    ScoreEditDialog,
    ScoreDeleteDialog,
    TimeInput,
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
