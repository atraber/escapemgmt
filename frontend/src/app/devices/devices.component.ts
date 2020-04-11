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
import {Stream} from '../stream';

import {DeviceAddStreamDialog} from './device-add-stream.dialog';
import {DeviceCreateDialog} from './device-create.dialog';
import {DeviceDeleteDialog} from './device-delete.dialog';

@Component({
  templateUrl : './devices.component.html',
  styleUrls : [ './devices.component.scss' ]
})
export class DevicesComponent {
  devices: Device[] = [];
  filteredDevices: Device[] = [];
  presetSelected: Preset = null;
  deviceSelected: Device = null;
  deviceSelectedStreamsDataSource = new MatTableDataSource<Stream>();
  deviceFilter: string = "";
  loaded = false;

  constructor(private devicesService: DevicesService, private dialog: MatDialog,
              private snackBar: MatSnackBar) {
    this.devices = this.devicesService.devices;
    this.loaded = this.devicesService.loaded;

    this.updateDeviceFilter();
    this.selectDevice(null);

    this.devicesService.devicesUpdated.subscribe(devices => {
      this.devices = devices;
      this.loaded = this.devicesService.loaded;
      this.updateDeviceFilter();
      this.selectDevice(null);
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
}
