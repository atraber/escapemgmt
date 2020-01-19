/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTableDataSource} from '@angular/material/table';
import moment from 'moment';
import {BehaviorSubject} from 'rxjs';

import {Device} from '../device';
import {DevicesService} from '../devices.service';
import {Preset} from '../preset';
import {PresetsService} from '../presets.service';
import {Stream} from '../stream';

import {DeviceAddStreamDialog} from './device-add-stream.dialog';
import {DeviceCreateDialog} from './device-create.dialog';

@Component({
  templateUrl : './devices.component.html',
  styleUrls : [ './devices.component.scss' ]
})
export class DevicesComponent {
  active_preset = null;
  devices: Device[] = [];
  filteredDevices: Device[] = [];
  presets: Preset[] = [];
  presetSelected: Preset = null;
  deviceSelected: Device = null;
  deviceSelectedStreamsDataSource = new MatTableDataSource<Stream>();
  deviceFilter: string = "";

  constructor(private devicesService: DevicesService,
              private presetsService: PresetsService, private dialog: MatDialog,
              private snackBar: MatSnackBar) {
    this.presets = this.presetsService.presets;
    this.active_preset = this.findActivePreset();

    this.devices = this.devicesService.devices;
    this.updateDeviceFilter();
    this.selectDevice(null);

    this.devicesService.devicesUpdated.subscribe(devices => {
      this.devices = devices;
      this.updateDeviceFilter();
      this.selectDevice(null);
    });

    this.presetsService.presetsUpdated.subscribe(presets => {
      this.presets = presets;
      if (this.active_preset == null) {
        this.active_preset = this.findActivePreset();
        this.selectDevice(null);
      }
    });
  }

  applyDeviceFilter(filterValue: string): void {
    this.deviceFilter = filterValue.trim().toLowerCase();
    this.updateDeviceFilter();
  }

  updateDeviceFilter(): void {
    if (this.deviceFilter.length == 0) {
      this.filteredDevices = this.devices;
    } else {
      let filtered = [];
      for (let device of this.devices) {
        if (device.name.trim().toLowerCase().indexOf(this.deviceFilter) != -1)
          filtered.push(device);
      }
      this.filteredDevices = filtered;
    }
  }

  selectDevice(device: Device|null): void {
    if (device == null) {
      if (this.deviceSelected == null && this.filteredDevices.length > 0) {
        this.deviceSelected = this.filteredDevices[0];
      }
    } else {
      this.deviceSelected = device;
    }

    if (this.deviceSelected != null) {
      let preset = this.active_preset;
      if (preset == null) {
        if (this.presets.length == 0)
          return;

        preset = this.presets[0];
      }
      this.deviceSelectPreset(preset);
    }
  }

  findActivePreset(): Preset|null {
    for (let preset of this.presets) {
      if (preset.active)
        return preset;
    }

    return null
  }

  deviceSelectPreset(preset: Preset): void {
    for (let dp of this.deviceSelected.presets_used) {
      if (dp.id == preset.id) {
        this.deviceSelectedStreamsDataSource.data = dp.streams;
        return;
      }
    }
    this.deviceSelectedStreamsDataSource.data = [];
  }

  deviceLastSeen(device: Device) {
    return moment.utc(device.last_seen * 1000).fromNow();
  }

  addDeviceDialog(): void {
    const dialogRef = this.dialog.open(DeviceCreateDialog, {width : '500px'});

    dialogRef.afterClosed().subscribe(result => {
      if (result != "") {
        this.selectDevice(null);
      }
    });
  }

  deleteDeviceDialog(device: Device): void {
    const dialogRef =
        this.dialog.open(DeviceDeleteDialog, {width : '400px', data : device});

    dialogRef.afterClosed().subscribe(result => {
      if (result != "") {
        this.selectDevice(null);
      }
    });
  }

  updateDevice(device: Device) {
    this.devicesService.updateDevice(device).subscribe(
        () => {
          this.snackBar.open('Device was saved.', 'Hide', {
            duration : 2000,
          });
        },
        err => {
          this.snackBar.open('Failed to save device. Please try again!', 'Hide',
                             {
                               duration : 2000,
                             });
        });
  }

  addPresetStreamDialog(device: Device, preset: Preset): void {
    if (preset == null) {
      this.snackBar.open(
          'No preset was selected. Please select a preset before adding streams.',
          'Hide', {
            duration : 2000,
          });
      return;
    }
    const dialogRef = this.dialog.open(DeviceAddStreamDialog, {
      width : '500px',
      data : {
        'device' : device,
        'preset' : preset,
      },
    });
  }

  removeStreamFromDevicePreset(device: Device, preset: Preset,
                               stream: Stream): void {
    let p_used = device.presets_used.find(e => { return e.id == preset.id; });

    if (p_used != undefined) {
      let index = p_used.streams.indexOf(stream);
      if (index >= 0) {
        p_used.streams.splice(index, 1);

        // TODO: This is a hack at best!
        this.devicesService.devicesUpdated.emit(this.devicesService.devices);
      } else {
        console.log('Stream not found: Cannot delete stream');
      }
    } else {
      console.log('Preset not found: Cannot delete stream');
    }
  }
}

@Component({
  selector : 'device-delete-dialog',
  templateUrl : 'device-delete-dialog.html',
})
export class DeviceDeleteDialog {
  constructor(private devicesService: DevicesService,
              public dialogRef: MatDialogRef<DeviceDeleteDialog>,
              private snackBar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data: Device) {}

  deleteDevice(device: Device) {
    this.devicesService.deleteDevice(device).subscribe(
        () => {
          this.snackBar.open('Device was deleted.', 'Hide', {
            duration : 2000,
          });
          this.dialogRef.close();
        },
        err => {
          this.snackBar.open('Failed to delete device. Please try again!',
                             'Hide', {
                               duration : 2000,
                             });
        });
  }
}
