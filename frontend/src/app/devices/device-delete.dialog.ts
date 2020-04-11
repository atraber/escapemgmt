/**
 * Copyright 2020 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import {Device} from '../device';
import {DevicesService} from '../devices.service';

@Component({
  templateUrl : 'device-delete.dialog.html',
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
