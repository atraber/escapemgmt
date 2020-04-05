/**
 * Copyright 2020 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import {PresetGroup} from '../preset-group';
import {PresetsService} from '../presets.service';

@Component({
  templateUrl : './preset-group-delete.dialog.html',
  styleUrls : [ './preset-group-delete.dialog.scss' ],
})
export class PresetGroupDeleteDialog {
  constructor(private presetsService: PresetsService,
              public dialogRef: MatDialogRef<PresetGroupDeleteDialog>,
              private snackBar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data: PresetGroup) {}

  delete(pg: PresetGroup) {
    this.presetsService.deletePresetGroup(pg).subscribe(
        () => {
          this.snackBar.open('Preset Group was deleted.', 'Hide', {
            duration : 2000,
          });
          this.dialogRef.close();
        },
        err => {
          this.snackBar.open('Failed to delete preset group. Please try again!',
                             'Hide', {
                               duration : 2000,
                             });
        });
  }
}
