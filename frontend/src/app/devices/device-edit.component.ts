/**
 * Copyright 2020 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {
  Component,
  Inject,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTableDataSource} from '@angular/material/table';
import moment from 'moment';

import {Device} from '../device';
import {DevicesService} from '../devices.service';
import {Preset} from '../preset';
import {PresetGroup} from '../preset-group';
import {PresetsService} from '../presets.service';
import {Stream} from '../stream';

import {DeviceAddStreamDialog} from './device-add-stream.dialog';
import {DeviceCreateDialog} from './device-create.dialog';
import {DeviceDeleteDialog} from './device-delete.dialog';

@Component({
  templateUrl : './device-edit.component.html',
  styleUrls : [ './device-edit.component.scss' ],
  selector : 'device-edit',
})
export class DeviceEditComponent implements OnChanges {
  @Input() device: Device;

  activePreset: Preset|null = null;
  selectedPreset: Preset|null = null;
  presets: Preset[] = [];
  presetGroups: PresetGroup[] = [];
  deviceFilter: string = "";
  loaded = false;

  constructor(private devicesService: DevicesService,
              private presetsService: PresetsService, private dialog: MatDialog,
              private snackBar: MatSnackBar) {
    this.presetsService.presetGroupsUpdated.subscribe(presetGroups => {
      this.presetGroups = presetGroups;
      this.updateData();
    });

    this.presetGroups = this.presetsService.presetGroups;
    this.updateData();
  }

  ngOnChanges(changs: SimpleChanges) { this.updateData(); }

  private updateData() {
    this.loaded = this.devicesService.loaded && this.presetsService.loaded;
    if (this.device != null) {
      if (this.device.presetGroup == null) {
        if (this.presetGroups.length > 0) {
          this.deviceSelectPresetGroup(this.presetGroups[0]);
        }
      } else {
        this.deviceSelectPresetGroup(<PresetGroup>this.device.presetGroup);
      }
    }
  }

  private updatePresetSelection() {
    if (this.device == null || this.device.presetGroup == null) {
      this.deviceSelectPreset(null);
      return;
    }

    // Ensure selected preset is part of the currently selected PresetGroup.
    // Just re-select it, if we find it.
    if (this.selectedPreset != null) {
      for (let preset of this.device.presetGroup.presets) {
        if (preset.id == this.selectedPreset.id) {
          this.deviceSelectPreset(preset);
          return;
        }
      }
    }

    let preset = this.activePreset;
    if (preset == null) {
      if (this.presets.length == 0) {
        this.deviceSelectPreset(null);
        return;
      }

      preset = this.presets[0];
    }

    this.deviceSelectPreset(preset);
  }

  deviceSelectPresetGroup(pg: PresetGroup) {
    this.device.presetGroup = pg;
    if (this.device.presetGroup == null) {
      this.presets = [];
      this.activePreset = null;
      this.updatePresetSelection();
      return;
    }

    if (this.device.presetGroup != null) {
      this.presets = this.device.presetGroup.presets;
      this.activePreset =
          this.findActivePreset(this.device.presetGroup.presets);
      this.updatePresetSelection();
    }
  }

  deviceSelectPreset(preset: Preset|null) { this.selectedPreset = preset; }

  private findActivePreset(presets: Preset[]): Preset|null {
    for (let preset of presets) {
      if (preset.active)
        return preset;
    }

    return null;
  }

  deleteDeviceDialog(device: Device): void {
    this.dialog.open(DeviceDeleteDialog, {width : '400px', data : device});
  }

  updateDevice(device: Device) {
    this.devicesService.updateDevice(device).subscribe(
        () => {
          this.snackBar.open('Device was saved.', 'Hide', {
            duration : 2000,
          });
        },
        err => {
          this.snackBar.open(
              'Failed to save device. Please try again!\nError: ' + err, 'Hide',
              {
                duration : 2000,
              });
        });
  }
}
