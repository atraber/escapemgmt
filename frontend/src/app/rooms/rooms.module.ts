/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from '../common.module';

import {FileUploadComponent} from './fileupload.component';
import {FileUploadService} from './fileupload.service';
import {RoomsComponent, RoomsDeleteDialog} from './rooms.component';
import {RoomCreateDialog} from './create.dialog';
import {ScoresComponent, ScoreAddDialog, ScoreEditDialog, ScoreDeleteDialog} from './scores.component';
import {TimeInput} from './timeinput.component';

const routes: Routes = [
  { path: 'rooms', component: RoomsComponent },
  { path: 'rooms/scores', component: ScoresComponent },
];

@NgModule({
  declarations: [
    FileUploadComponent,
    RoomCreateDialog,
    RoomsComponent,
    RoomsDeleteDialog,
    ScoreAddDialog,
    ScoreDeleteDialog,
    ScoreEditDialog,
    ScoresComponent,
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
  ],
  providers: [
    FileUploadService,
  ],
})
export class RoomsModule { }
