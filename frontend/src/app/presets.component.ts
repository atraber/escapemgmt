/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import { Component } from '@angular/core';
import { Preset } from './preset';
import { PresetsService } from './presets.service';

@Component({
  templateUrl: './presets.component.html',
  styleUrls: ['./presets.component.css']
})
export class PresetsComponent {
  presets: Preset[];
  preset_selected: Preset;
  new_preset_name: String;

  constructor(private presetsService: PresetsService) {
    this.presets = this.presetsService.presets;
    this.preset_selected = this.presetSelect();

    this.presetsService.presetsUpdated.subscribe(
      (presets) => this.presets = presets
    );
  }

  private presetSelect() {
    if (this.presets.length > 0)
      return this.presets[0];
    else
      return null;
  }

  deletePreset(preset: Preset) {
    this.presetsService.deletePreset(preset).subscribe();
    this.preset_selected = this.presetSelect();
  }

  addPreset(name: string) {
    var preset = new Preset();
    preset.name = name;
    this.presetsService.addPreset(preset).subscribe(preset => this.presets.push(preset));
  }

  updatePreset(preset: Preset) {
    this.presetsService.updatePreset(preset).subscribe();
  }
}
