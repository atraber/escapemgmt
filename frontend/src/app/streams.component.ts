/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import { Component } from '@angular/core';
import { DevicesService } from './devices.service';
import { Stream } from './stream';
import { StreamView } from './streamview';

@Component({
  templateUrl: './streams.component.html',
  styleUrls: ['./streams.component.css']
})
export class StreamsComponent {
  streams: Stream[];
  stream_selected: Stream;
  view: StreamView;
  new_stream_name: string;

  constructor(private devicesService: DevicesService) {
    this.streams = this.devicesService.streams;

    this.devicesService.streamsUpdated.subscribe(
      (streams) => this.streams = streams
    );

    this.stream_selected = this.streamSelect();
    // dummy, will never be used.
    this.view = new StreamView();
  }

  streamSelect() {
    if (this.streams.length > 0) {
      return this.streams[0];
    }
    return null;
  }

  deleteStream(stream: Stream) {
    this.devicesService.deleteStream(stream).subscribe();
    this.stream_selected = this.streamSelect();
  }

  addStream(name: string) {
    var stream = new Stream();
    stream.name = name;
    this.devicesService.addStream(stream).subscribe(stream => this.streams.push(stream));
  }

  updateStream(stream: Stream) {
    this.devicesService.updateStream(stream).subscribe();
  }

  submitStreamView() {
    if (this.view.id == undefined) {
      console.log('Creating new streamview because it has no id');
      let stream_selected = this.stream_selected;
      this.devicesService.addStreamView(this.view, stream_selected.id).subscribe(streamview => {
        stream_selected.streamviews.push(streamview);
      });
    } else {
      console.log('Updating existing streamview because it has an id');
      this.devicesService.updateStreamView(this.view).subscribe();
    }
  }

  newStreamView() {
    this.view = new StreamView();
  }

  editStreamView(view: StreamView): boolean {
    this.view = view;

    return false;
  }

  deleteStreamView(view: StreamView) {
    this.devicesService.deleteStreamView(this.stream_selected, view).subscribe();

    return false;
  }
}
