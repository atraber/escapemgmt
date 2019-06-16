/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from '../common.module';

import {DeviceAddStreamDialog} from './device-add-stream.dialog';
import {DeviceCreateDialog} from './device-create.dialog';
import {DevicesComponent, DeviceDeleteDialog} from './devices.component';
import {PresetsComponent} from './presets.component';
import {PresetCreateDialog} from './preset-create.dialog';
import {PresetDeleteDialog} from './preset-delete.dialog';
import {ScreensComponent} from './screens.component';
import {StreamCreateDialog} from './stream-create.dialog';
import {StreamEditDialog} from './stream-edit.dialog';
import {StreamsComponent, StreamDeleteDialog} from './streams.component';

const routes: Routes = [
  { path: 'devices', component: DevicesComponent },
  { path: 'devices/screens', component: ScreensComponent },
  { path: 'devices/streams', component: StreamsComponent },
  { path: 'devices/presets', component: PresetsComponent },
];

@NgModule({
  declarations: [
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
  ],
  entryComponents: [
    DeviceAddStreamDialog,
    DeviceCreateDialog,
    DeviceDeleteDialog,
    PresetCreateDialog,
    PresetDeleteDialog,
    StreamCreateDialog,
    StreamEditDialog,
    StreamDeleteDialog,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  exports: [
    RouterModule
  ]
})
export class DevicesModule { }
