/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar, MatTableDataSource} from '@angular/material';

import {DevicesService} from '../devices.service';
import {Device} from '../device';
import {Stream} from '../stream';


class StreamAnnotated {
  stream: Stream;
  added: boolean;
}


@Component({
  templateUrl: './device-add-stream.dialog.html',
  styleUrls: ['./device-add-stream.dialog.css']
})
export class DeviceAddStreamDialog {
  device: Device;
  streams: Stream[] = [];
  streamsDataSource = new MatTableDataSource<StreamAnnotated>();

  constructor(
      public dialogRef: MatDialogRef<DeviceAddStreamDialog>,
      private devicesService: DevicesService,
      private snackBar: MatSnackBar,
      @Inject(MAT_DIALOG_DATA) public data: Device) {
    this.device = data;

    this.streamsDataSource.filterPredicate = (data: StreamAnnotated, filter: string): boolean => {
      let value = data.stream.name.toLowerCase();
      return value.indexOf(filter) != -1;
    }

    this.streams = this.devicesService.streams;
    this.streamsDataSource.data = this.annotateStreams(this.streams);

    this.devicesService.streamsUpdated.subscribe(streams => {
      this.streams = streams;
      this.streamsDataSource.data = this.annotateStreams(this.streams);
    });
  }

  applyFilter(filterValue: string): void {
    this.streamsDataSource.filter = filterValue.trim().toLowerCase();
  }

  private annotateStreams(streams: Stream[]): StreamAnnotated[] {
    let added = new Set();
    for (let stream of this.device.streams) {
      added.add(stream.id);
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

  addStreamToDevice(device: Device, stream: Stream): void {
    this.device.streams.push(stream);
    // TODO: This is a hack at best!
    this.devicesService.devicesUpdated.emit(this.devicesService.devices);
    this.streamsDataSource.data = this.annotateStreams(this.streams);
  }

  removeStreamFromDevice(device: Device, stream: Stream): void {
    for (let i = 0; i < this.device.streams.length; i++) {
      if (this.device.streams[i].id == stream.id) {
        this.device.streams.splice(i, 1);

        // TODO: This is a hack at best!
        this.devicesService.devicesUpdated.emit(this.devicesService.devices);
        this.streamsDataSource.data = this.annotateStreams(this.streams);
        // At most one stream should match, thus we can early exit.
        break;
      }
    }
  }
}
