/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject, OnInit} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar, MatTableDataSource} from '@angular/material';
import {BehaviorSubject} from 'rxjs';
import * as moment from 'moment';

import {DeviceCreateDialog} from './device-create.dialog';
import {DevicesService} from '../devices.service';
import {PresetsService} from '../presets.service';
import {Device} from '../device';
import {Preset} from '../preset';
import {Stream} from '../stream';

@Component({
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.css']
})
export class DevicesComponent implements OnInit {
  devices: Device[];
  streams: Stream[];
  presets: Preset[];
  presetSelected: Preset = null;
  deviceSelected: Device = null;
  deviceSelectedStreamsDataSource = new StreamsDataSource();

  constructor(
      private devicesService: DevicesService,
      private presetsService: PresetsService,
      private dialog: MatDialog,
      private snackBar: MatSnackBar) {
    this.devices = this.devicesService.devices;
    this.streams = this.devicesService.streams;
    this.presets = this.presetsService.presets;

    this.devicesService.devicesUpdated.subscribe(devices => {
      this.devices = devices;
      this.selectDevice(null);
    });

    this.devicesService.streamsUpdated.subscribe(streams => {
      this.streams = streams;
    });

    this.presetsService.presetsUpdated.subscribe(presets => {
      this.presets = presets;
    });
  }

  ngOnInit() {
    // This is necessary since it will loose its selected device when
    // switching between pages.
    this.selectDevice(null);
  }

  selectDevice(device: Device | null): void {
    if (device == null) {
      if (this.deviceSelected == null && this.devices.length > 0) {
        this.deviceSelected = this.devices[0];
      }
    } else {
      this.deviceSelected = device;
    }

    if (this.deviceSelected != null) {
      this.deviceSelectedStreamsDataSource.dataChange.next(this.deviceSelected.streams);
    }
  }

  findActivePreset(): Preset | null {
    for (let preset of this.presets) {
      if (preset.active)
        return preset;
    }

    return null
  }

  deviceLastSeen(last_seen: number) {
    return moment.utc(last_seen * 1000).fromNow();
  }

  addDeviceDialog(): void {
    const dialogRef = this.dialog.open(DeviceCreateDialog, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != "") {
        this.selectDevice(null);
      }
    });
  }

  deleteDeviceDialog(device: Device): void {
    const dialogRef = this.dialog.open(DeviceDeleteDialog, {
      width: '400px',
      data: device
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != "") {
        this.selectDevice(null);
      }
    });
  }

  updateDevice(device: Device) {
    this.devicesService.updateDevice(device).subscribe(() => {
      this.snackBar.open('Device was saved.', 'Hide', {
        duration: 2000,
      });
    }, err => {
      this.snackBar.open('Failed to save device. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }

  addStreamDialog(device: Device): void {
    // TODO: This is not the correct dialog
    const dialogRef = this.dialog.open(DeviceCreateDialog, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != "") {
        this.selectDevice(null);
      }
    });
  }

  deleteStreamFromDevice(device: Device, stream: Stream): void {
    let index = device.streams.indexOf(stream);
    device.streams.splice(index, 1);
  }
}

class StreamsDataSource extends MatTableDataSource<Stream> {
  dataChange = new BehaviorSubject<Stream[]>([]);

  connect() {
    return this.dataChange;
  }

  disconnect(): void {
    return this.dataChange.complete();
  }
}

@Component({
  selector: 'device-delete-dialog',
  templateUrl: 'device-delete-dialog.html',
})
export class DeviceDeleteDialog {
  constructor(
      private devicesService: DevicesService,
      public dialogRef: MatDialogRef<DeviceDeleteDialog>,
      private snackBar: MatSnackBar,
      @Inject(MAT_DIALOG_DATA) public data: Device) {}

  deleteDevice(device) {
    this.devicesService.deleteDevice(device).subscribe(() => {
      this.snackBar.open('Device was deleted.', 'Hide', {
        duration: 2000,
      });
      this.dialogRef.close();
    }, err => {
      this.snackBar.open('Failed to delete device. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }
}
