/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTableDataSource} from '@angular/material/table';

import {Preset} from '../preset';
import {PresetsService} from '../presets.service';

@Component({
  templateUrl : './screens.component.html',
  styleUrls : [ './screens.component.scss' ]
})
export class ScreensComponent {
  dataSource = new MatTableDataSource<Preset>();

  constructor(private presetsService: PresetsService,
              private snackBar: MatSnackBar) {
    this.dataSource.data = this.presetsService.presets;

    this.presetsService.presetsUpdated.subscribe(
        presets => { this.dataSource.data = presets; });
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
