/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';

import {environment} from '../../environment';

import {DevicesService} from '../devices.service';
import {Stream} from '../stream';
import {StreamView} from '../streamview';

@Component({
  templateUrl : './view.component.html',
  styleUrls : [ './view.component.scss' ]
})
export class ViewStreamsComponent {
  readonly maxWidth = 640;
  readonly maxHeight = 480;

  streams: Stream[] = [];
  streamsFiltered: Stream[] = [];
  streamSelected: Stream = null;
  loaded = false;
  filter: string = "";

  constructor(private devicesService: DevicesService) {
    this.streams = this.devicesService.streams;
    this.loaded = this.devicesService.loaded;
    this.updateFilter();

    this.devicesService.streamsUpdated.subscribe(streams => {
      this.streams = streams;
      this.loaded = this.devicesService.loaded;
      this.updateFilter();
    });
  }

  applyFilter(filterValue: string) {
    this.filter = filterValue;
    this.updateFilter();
  }

  private updateFilter() { this.streamsFiltered = this.streams; }

  selectStream(stream: Stream) { this.streamSelected = stream; }

  streamPreviewUrl(stream: Stream): string {
    // TODO: Be smarter about this.
    if (stream.streamviews.length > 0) {
      return this.streamViewPreviewUrl(stream.streamviews[0]);
    } else {
      return "";
    }
  }

  streamViewPreviewUrl(streamview: StreamView): string {
    let width = streamview.crop_x2 - streamview.crop_x1;
    let height = streamview.crop_y2 - streamview.crop_y1;
    let outWidth = width;
    let outHeight = height;
    if (width > this.maxWidth || height > this.maxHeight) {
      let ratio = Math.max(width / this.maxWidth, height / this.maxHeight);
      outWidth = width / ratio;
      outHeight = height / ratio;
    }

    let url = environment.viewEndpoint +
              '/stream?url=' + encodeURIComponent(streamview.url) +
              '&x=' + streamview.crop_x1 + '&y=' + streamview.crop_y1 +
              '&width=' + width + '&height=' + height +
              '&out_width=' + outWidth + '&out_height=' + outHeight;
    console.log(url);
    return url;
  }
}
