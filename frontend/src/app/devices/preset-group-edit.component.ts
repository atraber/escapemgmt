/**
 * Copyright 2020 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTableDataSource} from '@angular/material/table';

import {Preset} from '../preset';
import {PresetGroup} from '../preset-group';
import {PresetsService} from '../presets.service';

import {PresetCreateDialog} from './preset-create.dialog';
import {PresetDeleteDialog} from './preset-delete.dialog';
import {PresetGroupDeleteDialog} from './preset-group-delete.dialog';

@Component({
  templateUrl : './preset-group-edit.component.html',
  styleUrls : [ './preset-group-edit.component.scss' ],
  selector : 'preset-group-edit',
})
export class PresetGroupEditComponent implements OnChanges {
  @Input() pg: PresetGroup;
  presetsDataSource = new MatTableDataSource<Preset>();

  constructor(private presetsService: PresetsService, private dialog: MatDialog,
              private snackBar: MatSnackBar) {
    this.presetsService.presetGroupsUpdated.subscribe(
        presetGroups => { this.updateDataSource(); });
  }

  ngOnChanges(changes: SimpleChanges) { this.updateDataSource(); }

  private updateDataSource() {
    if (this.pg != null) {
      this.presetsDataSource.data = this.pg.presets;
    }
  }

  deleteDialog(pg: PresetGroup) {
    this.dialog.open(PresetGroupDeleteDialog, {width : '500px', data : pg});
  }

  update(pg: PresetGroup) {
    this.presetsService.updatePresetGroup(pg).subscribe(
        () => {
          this.snackBar.open('Preset Group was saved.', 'Hide', {
            duration : 2000,
          });
        },
        err => {
          this.snackBar.open(
              'Failed to save Preset Group. Please try again!\nError: ' + err,
              'Hide', {
                duration : 2000,
              });
        });
  }

  addPresetDialog(pg: PresetGroup): void {
    this.dialog.open(PresetCreateDialog, {width : '500px', data : pg});
  }

  deletePresetDialog(preset): void {
    this.dialog.open(PresetDeleteDialog, {width : '400px', data : preset});
  }

  updatePreset(preset: Preset) {
    this.presetsService.updatePreset(preset).subscribe(
        () => {
          this.snackBar.open('Preset was saved.', 'Hide', {
            duration : 2000,
          });
        },
        err => {
          this.snackBar.open(
              'Failed to save preset. Please try again!\nError: ' + err, 'Hide',
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
          this.snackBar.open(
              'Failed to activate preset. Please try again!\nError: ' + err,
              'Hide', {
                duration : 2000,
              });
        });
  }
}
