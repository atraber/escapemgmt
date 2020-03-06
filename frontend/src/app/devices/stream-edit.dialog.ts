/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSelect} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';

import {DevicesService} from '../devices.service';
import {Stream} from '../stream';
import {StreamUtils} from '../stream-utils';
import {StreamView} from '../streamview';

@Component({
  templateUrl : './stream-edit.dialog.html',
  styleUrls : [ './stream-edit.dialog.scss' ]
})
export class StreamEditDialog {
  readonly maxWidth = 640;
  readonly maxHeight = 480;
  orientation: string;
  @ViewChild('orientationInput', {static : false}) orientationInput: MatSelect;
  newStreamViews: StreamView[] = [];
  deletedStreamViews: StreamView[] = [];

  constructor(public dialogRef: MatDialogRef<StreamEditDialog>,
              private devicesService: DevicesService,
              private snackBar: MatSnackBar, private streamUtils: StreamUtils,
              @Inject(MAT_DIALOG_DATA) public data: Stream) {
    this.orientation = data.orientation.toString();
  }

  orientationChange(): void {
    this.data.orientation = parseInt(this.orientation);
  }

  streamPreviewUrl(streamview: StreamView): string {
    return this.streamUtils.streamViewPreviewUrl(streamview, this.maxWidth,
                                                 this.maxHeight);
  }

  preview(streamview: StreamView) {
    streamview.frontend_url = this.streamUtils.streamViewPreviewUrl(streamview);
  }

  testParameters(streamview: StreamView) {
    this.streamUtils.streamViewInfo(streamview)
        .subscribe(
            si => {
              streamview.frontend_width = si[0];
              streamview.frontend_height = si[1];
            },
            err => {
              this.snackBar.open('Unable to get stream info', 'Hide', {
                duration : 2000,
              });
            });
  }

  addStreamView(): void {
    let sv = new StreamView();
    this.data.streamviews.push(sv);
    this.newStreamViews.push(sv);
  }

  deleteStreamView(streamview: StreamView): void {
    let index = this.data.streamviews.indexOf(streamview);
    this.data.streamviews.splice(index, 1);
    this.deletedStreamViews.push(streamview);

    // Check if it is part of the new stream views.
    let new_index = this.newStreamViews.indexOf(streamview);
    if (new_index != -1) {
      this.newStreamViews.splice(new_index, 1);
    }
  }

  updateStream(): void {
    // Update existing stream views.
    for (let sv of this.data.streamviews) {
      // Only update already existing stream views, not new ones.
      if (sv.id >= 0) {
        this.devicesService.updateStreamView(sv).subscribe(
            () => { console.log('StreamView was updated'); },
            err => {
              console.log('Failed to update streamview. Please try again!');
            });
      }
    }

    // Process stream views to add.
    for (let sv of this.newStreamViews) {
      this.devicesService.addStreamView(this.data, sv)
          .subscribe(() => { console.log('StreamView was added'); },
                     err => {
                       console.log(
                           'Failed to add streamview. Please try again!');
                     });
    }

    // Process stream views to delete.
    for (let sv of this.deletedStreamViews) {
      this.devicesService.deleteStreamView(this.data, sv)
          .subscribe(() => { console.log('StreamView was deleted'); },
                     err => {
                       console.log(
                           'Failed to delete streamview. Please try again!');
                     });
    }

    // Actually perform the stream update.
    this.devicesService.updateStream(this.data).subscribe(
        () => {
          this.snackBar.open('Stream was updated', 'Hide', {
            duration : 2000,
          });
          this.dialogRef.close();
        },
        err => {
          this.snackBar.open('Failed to update stream. Please try again!',
                             'Hide', {
                               duration : 2000,
                             });
        });
  }
}
