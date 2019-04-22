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
import {StreamsComponent} from './streams.component';

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
    PresetsComponent,
    StreamsComponent,
  ],
  entryComponents: [
    DeviceDeleteDialog,
    DeviceCreateDialog,
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
