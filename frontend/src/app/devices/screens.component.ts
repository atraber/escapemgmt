/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';

import {PresetGroup} from '../preset-group';
import {PresetsService} from '../presets.service';

@Component({
  templateUrl : './screens.component.html',
  styleUrls : [ './screens.component.scss' ]
})
export class ScreensComponent {
  presetGroups: PresetGroup[] = [];
  loaded = false;

  constructor(private presetsService: PresetsService) {
    this.presetsService.presetGroupsUpdated.subscribe(presetGroups => {
      this.presetGroups = this.presetsService.presetGroups;
      this.loaded = this.presetsService.loaded;
    });

    this.presetGroups = this.presetsService.presetGroups;
    this.loaded = this.presetsService.loaded;
  }
}
