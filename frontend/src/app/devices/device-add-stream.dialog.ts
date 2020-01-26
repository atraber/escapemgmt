/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
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
import {Stream} from '../stream';

class StreamAnnotated {
  stream: Stream;
  added: boolean;
}

@Component({
  templateUrl : './device-add-stream.dialog.html',
  styleUrls : [ './device-add-stream.dialog.scss' ]
})
export class DeviceAddStreamDialog {
  device: Device;
  preset: Preset;
  streams: Stream[] = [];
  streamsDataSource = new MatTableDataSource<StreamAnnotated>();

  constructor(public dialogRef: MatDialogRef<DeviceAddStreamDialog>,
              private devicesService: DevicesService,
              private snackBar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data) {
    this.device = data['device'];
    this.preset = data['preset'];

    this.streamsDataSource.filterPredicate =
        (data: StreamAnnotated, filter: string): boolean => {
          let value = data.stream.name.toLowerCase();
          return value.indexOf(filter) != -1;
        };

    this.streams = this.devicesService.streams;
    this.streamsDataSource.data = this.annotateStreams();

    this.devicesService.streamsUpdated.subscribe(streams => {
      this.streams = streams;
      this.streamsDataSource.data = this.annotateStreams();
    });

    this.devicesService.devicesUpdated.subscribe(
        devices => { this.streamsDataSource.data = this.annotateStreams(); });
  }

  applyFilter(filterValue: string): void {
    this.streamsDataSource.filter = filterValue.trim().toLowerCase();
  }

  private annotateStreams(): StreamAnnotated[] {
    let added = new Set();

    for (let ds of this.device.device_streams) {
      if (ds.preset_id == this.preset.id) {
        added.add(ds.stream_id);
      }
    }

    let arr: StreamAnnotated[] = [];
    for (let stream of this.streams) {
      let annotated = new StreamAnnotated();
      annotated.stream = stream;
      annotated.added = added.has(stream.id);

      arr.push(annotated);
    }

    return arr;
  }

  addStreamToDevice(device: Device, preset: Preset, stream: Stream): void {
    if (!this.devicesService.addStreamToDevicePreset(device, preset, stream)) {
      this.snackBar.open('Could not add stream to device.', 'Hide', {
        duration : 2000,
      });
    }
  }

  removeStreamFromDevice(device: Device, preset: Preset, stream: Stream): void {
    if (!this.devicesService.removeStreamFromDevicePreset(device, preset,
                                                          stream)) {
      this.snackBar.open('Could not remove stream from device.', 'Hide', {
        duration : 2000,
      });
    }
  }
}
