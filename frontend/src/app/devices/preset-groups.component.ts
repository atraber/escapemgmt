/**
 * Copyright 2020 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import {PresetGroup} from '../preset-group';
import {PresetsService} from '../presets.service';

import {PresetGroupCreateDialog} from './preset-group-create.dialog';

@Component({
  templateUrl : './preset-groups.component.html',
  styleUrls : [ './preset-groups.component.scss' ]
})
export class PresetGroupsComponent {
  presetGroups: PresetGroup[] = [];
  pgSelected: PresetGroup|null = null;
  loaded = false;

  constructor(private presetsService: PresetsService,
              private dialog: MatDialog) {
    this.presetsService.presetGroupsUpdated.subscribe(presetGroups => {
      this.presetGroups = this.presetsService.presetGroups;
      this.loaded = this.presetsService.loaded;
      this.checkSelection();
    });

    this.presetGroups = this.presetsService.presetGroups;
    this.loaded = this.presetsService.loaded;
    this.checkSelection();
  }

  addDialog(): void {
    const dialogRef =
        this.dialog.open(PresetGroupCreateDialog, {width : '500px'});
    dialogRef.afterClosed().subscribe(result => { this.checkSelection(); });
  }

  private checkSelection() {
    if (!this.loaded) {
      return;
    }

    if (this.pgSelected == null) {
      if (this.presetGroups.length > 0) {
        this.pgSelected = this.presetGroups[0];
      }
    } else if (this.presetGroups.findIndex(el => el.id == this.pgSelected.id) ==
               -1) {
      // The previous Preset Group was deleted. We are looking for a another one
      // to select.
      if (this.presetGroups.length > 0) {
        this.pgSelected = this.presetGroups[0];
      } else {
        this.pgSelected = null;
      }
    }
  }

  select(pg: PresetGroup) { this.pgSelected = pg; }
}
