/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {MatDialogRef, MatSnackBar} from '@angular/material';

import {DevicesService} from '../devices.service';
import {Device} from '../device';

@Component({
  templateUrl: './device-create.dialog.html',
  styleUrls: ['./device-create.dialog.css']
})
export class DeviceCreateDialog {
  device: Device = new Device();

  constructor(
      public dialogRef: MatDialogRef<DeviceCreateDialog>,
      private devicesService: DevicesService,
      private snackBar: MatSnackBar) {}

  addDevice(device: Device): void {
    this.devicesService.addDevice(device).subscribe(() => {
      this.snackBar.open('New Device was created', 'Hide', {
        duration: 2000,
      });
      this.dialogRef.close();
    }, err => {
      this.snackBar.open('Failed to create device. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }
}
