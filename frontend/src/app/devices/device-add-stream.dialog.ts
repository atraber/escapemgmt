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
        (data: StreamAnnotated, filter: string):
            boolean => {
              let value = data.stream.name.toLowerCase();
              return value.indexOf(filter) != -1;
            }

                       this.streams = this.devicesService.streams;
    this.streamsDataSource.data =
        this.annotateStreams(this.streams, this.preset);

    this.devicesService.streamsUpdated.subscribe(streams => {
      this.streams = streams;
      this.streamsDataSource.data =
          this.annotateStreams(this.streams, this.preset);
    });
  }

  applyFilter(filterValue: string): void {
    this.streamsDataSource.filter = filterValue.trim().toLowerCase();
  }

  private annotateStreams(streams: Stream[],
                          preset: Preset): StreamAnnotated[] {
    let added = new Set();

    // TODO: This is terrible and should be refactored...
    let p_used =
        this.device.presets_used.find(e => { return e.id == preset.id; });

    if (p_used != undefined) {
      for (let stream of p_used.streams) {
        added.add(stream.id);
      }
    }

    let arr: StreamAnnotated[] = [];
    for (let stream of streams) {
      let annotated = new StreamAnnotated();
      annotated.stream = stream;
      annotated.added = added.has(stream.id);

      arr.push(annotated);
    }

    return arr;
  }

  addStreamToDevice(device: Device, preset: Preset, stream: Stream): void {
    // TODO: This is terrible and should be refactored...
    let p_used = device.presets_used.find(e => { return e.id == preset.id; });

    if (p_used == undefined) {
      // TODO: Implement a real clone or find another option how to do this.
      let cloned = new Preset();
      cloned.id = preset.id;
      cloned.name = preset.name;
      cloned.active = preset.active;
      cloned.streams = [];
      device.presets_used.push(cloned);
      p_used = cloned;
    }

    p_used.streams.push(stream);
    // TODO: This is a hack at best!
    this.devicesService.devicesUpdated.emit(this.devicesService.devices);
    this.streamsDataSource.data =
        this.annotateStreams(this.streams, this.preset);
  }

  removeStreamFromDevice(device: Device, preset: Preset, stream: Stream): void {
    // TODO: This is terrible and should be refactored...
    let p_used = device.presets_used.find(e => { return e.id == preset.id; });

    if (p_used != undefined) {
      for (let i = 0; i < p_used.streams.length; i++) {
        if (p_used.streams[i].id == stream.id) {
          p_used.streams.splice(i, 1);

          // TODO: This is a hack at best!
          this.devicesService.devicesUpdated.emit(this.devicesService.devices);
          this.streamsDataSource.data =
              this.annotateStreams(this.streams, this.preset);
          // At most one stream should match, thus we can early exit.
          break;
        }
      }
    } else {
      console.log('Could not remove stream: Preset not found');
    }
  }
}
