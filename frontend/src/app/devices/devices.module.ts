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
import {PresetGroupCreateDialog} from './preset-group-create.dialog';
import {PresetGroupDeleteDialog} from './preset-group-delete.dialog';
import {PresetGroupEditComponent} from './preset-group-edit.component';
import {PresetGroupFormComponent} from './preset-group-form.component';
import {PresetGroupsComponent} from './preset-groups.component';
import {PresetsComponent} from './presets.component';
import {ScreenGroupComponent} from './screen-group.component';
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
  {path : 'devices/presetgroups', component : PresetGroupsComponent},
  {path : 'devices/view', component : ViewStreamsComponent},
];

@NgModule({
  declarations : [
    DeviceAddStreamDialog,    DeviceCreateDialog,      DeviceDeleteDialog,
    DevicesComponent,         PresetCreateDialog,      PresetDeleteDialog,
    PresetGroupCreateDialog,  PresetGroupDeleteDialog, PresetGroupEditComponent,
    PresetGroupFormComponent, PresetGroupsComponent,   PresetsComponent,
    ScreenGroupComponent,     ScreensComponent,        StreamCreateDialog,
    StreamDeleteDialog,       StreamEditDialog,        StreamsComponent,
    ViewStreamsComponent,
  ],
  entryComponents : [
    DeviceAddStreamDialog,
    DeviceCreateDialog,
    DeviceDeleteDialog,
    PresetCreateDialog,
    PresetDeleteDialog,
    PresetGroupCreateDialog,
    PresetGroupDeleteDialog,
    StreamCreateDialog,
    StreamDeleteDialog,
    StreamEditDialog,
  ],
  imports : [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  exports : [ RouterModule ]
})
export class DevicesModule {
}
