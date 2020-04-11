/**
 * Copyright 2020 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTableDataSource} from '@angular/material/table';

import {NavService} from '../nav.service';
import {Preset} from '../preset';
import {PresetGroup} from '../preset-group';
import {PresetsService} from '../presets.service';

@Component({
  templateUrl : './screen-group.component.html',
  styleUrls : [ './screen-group.component.scss' ],
  selector : 'screen-group',
})
export class ScreenGroupComponent implements OnChanges {
  @Input() pg: PresetGroup;
  dataSource = new MatTableDataSource<Preset>();
  screenFilter: string = "";
  loaded = false;

  constructor(private presetsService: PresetsService,
              private navService: NavService) {
    this.presetsService.presetsUpdated.subscribe(
        presets => { this.updateFilter(); });
    this.presetsService.presetGroupsUpdated.subscribe(
        presets => { this.updateFilter(); });
    this.updateFilter();
  }

  activatePreset(preset: Preset) {
    this.presetsService.activatePreset(preset).subscribe(
        () => { this.navService.message('Preset was activated.'); },
        err => {
          this.navService.message(
              'Failed to activate preset. Please try again!');
        });
  }

  applyFilter(filterValue: string): void {
    this.screenFilter = filterValue.trim().toLowerCase();
    this.updateFilter();
  }

  ngOnChanges(changes: SimpleChanges) { this.updateFilter(); }

  private updateFilter() {
    if (this.pg == null) {
      return;
    }

    if (this.screenFilter.length == 0) {
      this.dataSource.data = this.pg.presets;
    } else {
      let filtered = [];
      for (let preset of this.pg.presets) {
        if (preset.name.trim().toLowerCase().indexOf(this.screenFilter) != -1)
          filtered.push(preset);
      }
      this.dataSource.data = filtered;
    }
  }
}
