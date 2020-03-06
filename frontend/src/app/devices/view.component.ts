/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';

import {environment} from '../../environment';
import {DevicesService} from '../devices.service';
import {Stream} from '../stream';
import {StreamUtils} from '../stream-utils';
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

  constructor(private devicesService: DevicesService,
              private streamUtils: StreamUtils) {
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

  private updateFilter() {
    if (this.filter.length == 0) {
      this.streamsFiltered = this.streams;
    } else {
      let filtered = [];
      for (let stream of this.streams) {
        if (stream.name.trim().toLowerCase().indexOf(this.filter) != -1)
          filtered.push(stream);
      }
      this.streamsFiltered = filtered;
    }
  }

  selectStream(stream: Stream) { this.streamSelected = stream; }

  streamPreviewUrl(stream: Stream): string {
    return this.streamUtils.streamPreviewUrl(stream, this.maxWidth,
                                             this.maxHeight);
  }
}
