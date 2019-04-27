/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {MatDialogRef, MatSnackBar} from '@angular/material';

import {DevicesService} from '../devices.service';
import {Stream} from '../stream';

@Component({
  templateUrl: './stream-create.dialog.html',
  styleUrls: ['./stream-create.dialog.css']
})
export class StreamCreateDialog {
  stream: Stream = new Stream();

  constructor(
      public dialogRef: MatDialogRef<StreamCreateDialog>,
      private devicesService: DevicesService,
      private snackBar: MatSnackBar) {}

  addStream(stream: Stream): void {
    this.devicesService.addStream(stream).subscribe(() => {
      this.snackBar.open('New stream was created', 'Hide', {
        duration: 2000,
      });
      this.dialogRef.close();
    }, err => {
      this.snackBar.open('Failed to create stream. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }
}
