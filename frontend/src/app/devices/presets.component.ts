/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import {Preset} from '../preset';
import {PresetsService} from '../presets.service';

import {PresetCreateDialog} from './preset-create.dialog';
import {PresetDeleteDialog} from './preset-delete.dialog';

@Component({
  templateUrl : './presets.component.html',
  styleUrls : [ './presets.component.scss' ]
})
export class PresetsComponent {
  presets: Preset[] = [];
  loaded = false;

  constructor(private presetsService: PresetsService, private dialog: MatDialog,
              private snackBar: MatSnackBar) {
    this.presets = this.presetsService.presets;
    this.loaded = this.presetsService.loaded;

    this.presetsService.presetsUpdated.subscribe(presets => {
      this.presets = presets;
      this.loaded = this.presetsService.loaded;
    });
  }

  addPresetDialog(): void {
    const dialogRef = this.dialog.open(PresetCreateDialog, {width : '500px'});
  }

  deletePresetDialog(preset): void {
    const dialogRef =
        this.dialog.open(PresetDeleteDialog, {width : '400px', data : preset});
  }

  addPreset(name: string) {
    var preset = new Preset();
    preset.name = name;
    this.presetsService.addPreset(preset).subscribe(
        preset => this.presets.push(preset));
  }

  deletePreset(preset: Preset) {
    this.presetsService.deletePreset(preset).subscribe();
  }

  updatePreset(preset: Preset) {
    this.presetsService.updatePreset(preset).subscribe(
        () => {
          this.snackBar.open('Preset was saved.', 'Hide', {
            duration : 2000,
          });
        },
        err => {
          this.snackBar.open('Failed to save preset. Please try again!', 'Hide',
                             {
                               duration : 2000,
                             });
        });
  }

  activatePreset(preset: Preset) {
    this.presetsService.activatePreset(preset).subscribe(
        () => {
          this.snackBar.open('Preset was activated.', 'Hide', {
            duration : 2000,
          });
        },
        err => {
          this.snackBar.open('Failed to activate preset. Please try again!',
                             'Hide', {
                               duration : 2000,
                             });
        });
  }
}
