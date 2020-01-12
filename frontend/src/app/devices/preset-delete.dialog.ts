/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import {Preset} from '../preset';
import {PresetsService} from '../presets.service';

@Component({
  selector : 'preset-delete-dialog',
  templateUrl : 'preset-delete.dialog.html',
})
export class PresetDeleteDialog {
  constructor(private presetsService: PresetsService,
              public dialogRef: MatDialogRef<PresetDeleteDialog>,
              private snackBar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data: Preset) {}

  deletePreset(preset) {
    this.presetsService.deletePreset(preset).subscribe(
        () => {
          this.snackBar.open('Preset was deleted.', 'Hide', {
            duration : 2000,
          });
          this.dialogRef.close();
        },
        err => {
          this.snackBar.open('Failed to delete preset. Please try again!',
                             'Hide', {
                               duration : 2000,
                             });
        });
  }
}
