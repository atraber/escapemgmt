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
  streams: Stream[] = [];
  presetSelected: Preset = null;
  deviceSelected: Device = null;
  deviceSelectedStreamsDataSource = new MatTableDataSource<Stream>();
  deviceFilter: string = "";
  loaded = false;

  constructor(private devicesService: DevicesService,
              private presetsService: PresetsService, private dialog: MatDialog,
              private snackBar: MatSnackBar) {
    this.presets = this.presetsService.presets;
    this.devices = this.devicesService.devices;
    this.streams = this.devicesService.streams;
    this.updateLoaded();

    this.active_preset = this.findActivePreset();
    this.updateDeviceFilter();
    this.selectDevice(null);

    this.devicesService.streamsUpdated.subscribe(streams => {
      this.streams = streams;
      this.updateLoaded();
      this.updateDeviceFilter();
      this.selectDevice(null);
    });

    this.devicesService.devicesUpdated.subscribe(devices => {
      this.devices = devices;
      this.updateLoaded();
      this.updateDeviceFilter();
      this.selectDevice(null);
    });

    this.presetsService.presetsUpdated.subscribe(presets => {
      this.presets = presets;
      this.updateLoaded();
      if (this.active_preset == null) {
        this.active_preset = this.findActivePreset();
        this.selectDevice(null);
      }
    });
  }

  private updateLoaded() {
    this.loaded = this.devicesService.loaded && this.presetsService.loaded;
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

    // Update table if we have found a selected device.
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

  deviceSelectPreset(preset: Preset): void {
    this.deviceSelectedStreamsDataSource.data =
        this.devicesService.getDeviceStreamsByPreset(this.deviceSelected,
                                                     preset);
  }

  findActivePreset(): Preset|null {
    for (let preset of this.presets) {
      if (preset.active)
        return preset;
    }

    return null;
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
    if (!this.devicesService.removeStreamFromDevicePreset(device, preset,
                                                          stream)) {
      this.snackBar.open('Unable to remove stream from device.', 'Hide', {
        duration : 2000,
      });
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
