/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTableDataSource} from '@angular/material/table';

import {NavService} from '../nav.service';
import {Preset} from '../preset';
import {PresetsService} from '../presets.service';

@Component({
  templateUrl : './screens.component.html',
  styleUrls : [ './screens.component.scss' ]
})
export class ScreensComponent {
  dataSource = new MatTableDataSource<Preset>();
  screenFilter: string = "";
  loaded = false;

  constructor(private presetsService: PresetsService,
              private navService: NavService) {
    this.updateFilter();

    this.presetsService.presetsUpdated.subscribe(
        presets => { this.updateFilter(); });
  }

  activatePreset(preset: Preset) {
    this.presetsService.activatePreset(preset).subscribe(
        () => { this.navService.message('Preset was activated.'); }, err => {
          () => {
            this.navService.message(
                'Failed to activate preset. Please try again!');
          }
        });
  }

  applyFilter(filterValue: string): void {
    this.screenFilter = filterValue.trim().toLowerCase();
    this.updateFilter();
  }

  updateFilter() {
    this.loaded = this.presetsService.loaded;
    if (this.screenFilter.length == 0) {
      this.dataSource.data = this.presetsService.presets;
    } else {
      let filtered = [];
      for (let preset of this.presetsService.presets) {
        if (preset.name.trim().toLowerCase().indexOf(this.screenFilter) != -1)
          filtered.push(preset);
      }
      this.dataSource.data = filtered;
    }
  }
}
