/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatSelect} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTableDataSource} from '@angular/material/table';

import {DevicesService} from '../devices.service';
import {Stream} from '../stream';
import {StreamView} from '../streamview';

import {StreamCreateDialog} from './stream-create.dialog';
import {StreamEditDialog} from './stream-edit.dialog';

@Component({
  templateUrl : './streams.component.html',
  styleUrls : [ './streams.component.scss' ]
})
export class StreamsComponent {
  streams: Stream[] = [];
  streamsDataSource = new MatTableDataSource<Stream>();
  loaded = false;

  constructor(private devicesService: DevicesService, private dialog: MatDialog,
              private snackBar: MatSnackBar) {
    this.streams = this.devicesService.streams;
    this.streamsDataSource.data = this.streams;
    this.loaded = this.devicesService.loaded;

    this.devicesService.streamsUpdated.subscribe(streams => {
      this.streams = streams;
      this.streamsDataSource.data = this.streams;
      this.loaded = this.devicesService.loaded;
    });
  }

  applyFilter(filterValue: string): void {
    this.streamsDataSource.filter = filterValue.trim().toLowerCase();
  }

  addStreamDialog(): void {
    this.dialog.open(StreamCreateDialog, {width : '500px'});
  }

  editStreamDialog(stream: Stream): void {
    this.dialog.open(StreamEditDialog, {width : '600px', data : stream});
  }

  deleteStreamDialog(stream: Stream): void {
    this.dialog.open(StreamDeleteDialog, {width : '400px', data : stream});
  }

  updateStream(stream: Stream) {
    this.devicesService.updateStream(stream).subscribe();
  }

  submitStreamView() {
    // if (this.view.id == undefined) {
    //  console.log('Creating new streamview because it has no id');
    //  this.devicesService.addStreamView(this.view,
    //  stream_selected.id).subscribe(streamview => {
    //    stream_selected.streamviews.push(streamview);
    //  });
    //} else {
    //  console.log('Updating existing streamview because it has an id');
    //  this.devicesService.updateStreamView(this.view).subscribe();
    //}
  }

  newStreamView() {
    // this.view = new StreamView();
  }

  editStreamView(view: StreamView): boolean {
    // this.view = view;

    return false;
  }

  deleteStreamView(view: StreamView) {
    // this.devicesService.deleteStreamView(this.stream_selected,
    // view).subscribe();

    return false;
  }
}

@Component({
  selector : 'stream-delete-dialog',
  templateUrl : 'stream-delete.dialog.html',
})
export class StreamDeleteDialog {
  constructor(private devicesService: DevicesService,
              public dialogRef: MatDialogRef<StreamDeleteDialog>,
              private snackBar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data: Stream) {}

  deleteStream(stream: Stream) {
    this.devicesService.deleteStream(stream).subscribe(
        () => {
          this.snackBar.open('Stream was deleted.', 'Hide', {
            duration : 2000,
          });
          this.dialogRef.close();
        },
        err => {
          this.snackBar.open('Failed to delete stream. Please try again!',
                             'Hide', {
                               duration : 2000,
                             });
        });
  }
}
