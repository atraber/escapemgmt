/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import {Preset} from '../preset';
import {PresetGroup} from '../preset-group';
import {PresetsService} from '../presets.service';

@Component({
  templateUrl : './preset-create.dialog.html',
  styleUrls : [ './preset-create.dialog.scss' ]
})
export class PresetCreateDialog {
  preset: Preset = new Preset();

  constructor(public dialogRef: MatDialogRef<PresetCreateDialog>,
              private presetsService: PresetsService,
              private snackBar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data: PresetGroup) {
    this.preset.presetGroup = data;
    this.preset.preset_group_id = data.id;
  }

  addPreset(preset: Preset): void {
    this.presetsService.addPreset(preset).subscribe(
        () => {
          this.snackBar.open('New Preset was created', 'Hide', {
            duration : 2000,
          });
          this.dialogRef.close();
        },
        err => {
          this.snackBar.open(
              'Failed to create preset. Please try again!\nError: ' + err,
              'Hide', {
                duration : 2000,
              });
        });
  }
}
