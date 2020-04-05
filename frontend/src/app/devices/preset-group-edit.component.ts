/**
 * Copyright 2020 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Input} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import {PresetGroup} from '../preset-group';
import {PresetsService} from '../presets.service';

import {PresetGroupDeleteDialog} from './preset-group-delete.dialog';

@Component({
  templateUrl : './preset-group-edit.component.html',
  styleUrls : [ './preset-group-edit.component.scss' ],
  selector : 'preset-group-edit',
})
export class PresetGroupEditComponent {
  @Input() pg: PresetGroup;

  constructor(private presetsService: PresetsService, private dialog: MatDialog,
              private snackBar: MatSnackBar) {}

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
          this.snackBar.open('Failed to save Preset Group. Please try again!',
                             'Hide', {
                               duration : 2000,
                             });
        });
  }
}
