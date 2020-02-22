/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {CommonModule} from '../common.module';

import {DeviceAddStreamDialog} from './device-add-stream.dialog';
import {DeviceCreateDialog} from './device-create.dialog';
import {DeviceDeleteDialog, DevicesComponent} from './devices.component';
import {PresetCreateDialog} from './preset-create.dialog';
import {PresetDeleteDialog} from './preset-delete.dialog';
import {PresetsComponent} from './presets.component';
import {ScreensComponent} from './screens.component';
import {StreamCreateDialog} from './stream-create.dialog';
import {StreamEditDialog} from './stream-edit.dialog';
import {StreamDeleteDialog, StreamsComponent} from './streams.component';
import {ViewStreamsComponent} from './view.component';

const routes: Routes = [
  {path : 'devices', component : DevicesComponent},
  {path : 'devices/screens', component : ScreensComponent},
  {path : 'devices/streams', component : StreamsComponent},
  {path : 'devices/presets', component : PresetsComponent},
  {path : 'devices/view', component : ViewStreamsComponent},
];

@NgModule({
  declarations : [
    DeviceAddStreamDialog,
    DeviceCreateDialog,
    DeviceDeleteDialog,
    DevicesComponent,
    PresetCreateDialog,
    PresetDeleteDialog,
    PresetsComponent,
    ScreensComponent,
    StreamCreateDialog,
    StreamEditDialog,
    StreamDeleteDialog,
    StreamsComponent,
    ViewStreamsComponent,
  ],
  entryComponents : [
    DeviceAddStreamDialog,
    DeviceCreateDialog,
    DeviceDeleteDialog,
    PresetCreateDialog,
    PresetDeleteDialog,
    StreamCreateDialog,
    StreamEditDialog,
    StreamDeleteDialog,
  ],
  imports : [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  exports : [ RouterModule ]
})
export class DevicesModule {
}
