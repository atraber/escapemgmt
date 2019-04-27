/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA, MatSnackBar} from '@angular/material';

import {DevicesService} from '../devices.service';
import {Stream} from '../stream';

@Component({
  templateUrl: './stream-edit.dialog.html',
  styleUrls: ['./stream-edit.dialog.css']
})
export class StreamEditDialog {
  constructor(
      public dialogRef: MatDialogRef<StreamEditDialog>,
      private devicesService: DevicesService,
      private snackBar: MatSnackBar,
      @Inject(MAT_DIALOG_DATA) public data: Stream) {}

  updateStream(): void {
    this.devicesService.updateStream(this.data).subscribe(() => {
      this.snackBar.open('Stream was updated', 'Hide', {
        duration: 2000,
      });
      this.dialogRef.close();
    }, err => {
      this.snackBar.open('Failed to update stream. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }
}
