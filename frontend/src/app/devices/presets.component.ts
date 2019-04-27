/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar} from '@angular/material';

import {PresetCreateDialog} from './preset-create.dialog';
import {PresetDeleteDialog} from './preset-delete.dialog';
import {Preset} from '../preset';
import {PresetsService} from '../presets.service';

@Component({
  templateUrl: './presets.component.html',
  styleUrls: ['./presets.component.css']
})
export class PresetsComponent {
  presets: Preset[] = [];

  constructor(
      private presetsService: PresetsService,
      private dialog: MatDialog,
      private snackBar: MatSnackBar) {
    this.presets = this.presetsService.presets;

    this.presetsService.presetsUpdated.subscribe(presets => {
      this.presets = presets;
    });
  }

  addPresetDialog(): void {
    const dialogRef = this.dialog.open(PresetCreateDialog, {
      width: '500px'
    });
  }

  deletePresetDialog(preset): void {
    const dialogRef = this.dialog.open(PresetDeleteDialog, {
      width: '400px',
      data: preset
    });
  }

  addPreset(name: string) {
    var preset = new Preset();
    preset.name = name;
    this.presetsService.addPreset(preset).subscribe(preset => this.presets.push(preset));
  }

  deletePreset(preset: Preset) {
    this.presetsService.deletePreset(preset).subscribe();
  }

  updatePreset(preset: Preset) {
    this.presetsService.updatePreset(preset).subscribe(() => {
      this.snackBar.open('Preset was saved.', 'Hide', {
        duration: 2000,
      });
    }, err => {
      this.snackBar.open('Failed to save preset. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }

  activatePreset(preset: Preset) {
    this.presetsService.activatePreset(preset).subscribe(() => {
      this.snackBar.open('Preset was activated.', 'Hide', {
        duration: 2000,
      });
    }, err => {
      this.snackBar.open('Failed to activate preset. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }
}
