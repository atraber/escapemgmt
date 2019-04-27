/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from '../common.module';

import {DeviceCreateDialog} from './device-create.dialog';
import {DevicesComponent, DeviceDeleteDialog} from './devices.component';
import {DevicesRootComponent} from './root.component';
import {PresetsComponent} from './presets.component';
import {PresetCreateDialog} from './preset-create.dialog';
import {PresetDeleteDialog} from './preset-delete.dialog';
import {StreamCreateDialog} from './stream-create.dialog';
import {StreamEditDialog} from './stream-edit.dialog';
import {StreamsComponent, StreamDeleteDialog} from './streams.component';

const routes: Routes = [
  {
    path: 'devices',
    component: DevicesRootComponent,
    children: [
      { path: '', component: DevicesComponent },
      { path: 'streams', component: StreamsComponent },
      { path: 'presets', component: PresetsComponent },
    ]
  },
];

@NgModule({
  declarations: [
    DeviceCreateDialog,
    DeviceDeleteDialog,
    DevicesComponent,
    DevicesRootComponent,
    PresetCreateDialog,
    PresetDeleteDialog,
    PresetsComponent,
    StreamCreateDialog,
    StreamEditDialog,
    StreamDeleteDialog,
    StreamsComponent,
  ],
  entryComponents: [
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
