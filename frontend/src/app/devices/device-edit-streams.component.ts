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

import {Device} from '../device';
import {DevicesService} from '../devices.service';
import {Preset} from '../preset';
import {PresetsService} from '../presets.service';
import {Stream} from '../stream';

import {DeviceAddStreamDialog} from './device-add-stream.dialog';

@Component({
  templateUrl : './device-edit-streams.component.html',
  styleUrls : [ './device-edit-streams.component.scss' ],
  selector : 'device-edit-streams',
})
export class DeviceEditStreamsComponent implements OnChanges {
  @Input() device: Device;
  @Input() preset: Preset;

  private streams: Stream[] = [];
  streamsDataSource = new MatTableDataSource<Stream>();

  constructor(private devicesService: DevicesService,
              private presetsService: PresetsService, private dialog: MatDialog,
              private snackBar: MatSnackBar) {
    this.devicesService.streamsUpdated.subscribe(streams => {
      this.streams = streams;
      this.updateData();
    });

    this.streams = this.devicesService.streams;
    this.updateData();
  }

  ngOnChanges(changs: SimpleChanges) { this.updateData(); }

  private updateData() {
    if (this.device == null || this.preset == null) {
      this.streamsDataSource.data = [];
      return;
    }

    this.streamsDataSource.data =
        this.devicesService.getDeviceStreamsByPreset(this.device, this.preset);
  }

  addPresetStreamDialog(device: Device, preset: Preset): void {
    if (preset == null) {
      this.snackBar.open(
          'No preset was selected. You need to select a preset before you can add streams.',
          'Hide', {
            duration : 2000,
          });
      return;
    }
    const dialogRef = this.dialog.open(DeviceAddStreamDialog, {
      width : '500px',
      data : {
        'device' : device,
        'preset' : preset,
      },
    });
  }

  removeStreamFromDevicePreset(device: Device, preset: Preset,
                               stream: Stream): void {
    if (!this.devicesService.removeStreamFromDevicePreset(device, preset,
                                                          stream)) {
      this.snackBar.open('Unable to remove stream from device.', 'Hide', {
        duration : 2000,
      });
    }
  }
}
