/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import {PresetGroup} from '../preset-group';
import {PresetsService} from '../presets.service';

@Component({
  templateUrl : './preset-group-create.dialog.html',
  styleUrls : [ './preset-group-create.dialog.scss' ]
})
export class PresetGroupCreateDialog {
  pg: PresetGroup = new PresetGroup();

  constructor(public dialogRef: MatDialogRef<PresetGroupCreateDialog>,
              private presetsService: PresetsService,
              private snackBar: MatSnackBar) {}

  add(pg: PresetGroup): void {
    this.presetsService.addPresetGroup(pg).subscribe(
        () => {
          this.snackBar.open('New Preset Group was created', 'Hide', {
            duration : 2000,
          });
          this.dialogRef.close();
        },
        err => {
          this.snackBar.open('Failed to create preset group. Please try again!',
                             'Hide', {
                               duration : 2000,
                             });
        });
  }
}
