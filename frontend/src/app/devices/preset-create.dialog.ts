/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {MatDialogRef, MatSnackBar} from '@angular/material';

import {PresetsService} from '../presets.service';
import {Preset} from '../preset';

@Component({
  templateUrl: './preset-create.dialog.html',
  styleUrls: ['./preset-create.dialog.css']
})
export class PresetCreateDialog {
  preset: Preset = new Preset();

  constructor(
      public dialogRef: MatDialogRef<PresetCreateDialog>,
      private presetsService: PresetsService,
      private snackBar: MatSnackBar) {}

  addPreset(preset: Preset): void {
    this.presetsService.addPreset(preset).subscribe(() => {
      this.snackBar.open('New Preset was created', 'Hide', {
        duration: 2000,
      });
      this.dialogRef.close();
    }, err => {
      this.snackBar.open('Failed to create preset. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }
}
