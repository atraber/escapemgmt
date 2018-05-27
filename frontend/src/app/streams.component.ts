import { Component } from '@angular/core';
import { DevicesService } from './devices.service';
import { Stream } from './stream';

@Component({
  templateUrl: './streams.component.html',
  styleUrls: ['./streams.component.css']
})
export class StreamsComponent {
  streams: Stream[];
  stream_selected: Stream;

  constructor(private devicesService: DevicesService) {
    this.streams = this.devicesService.streams;

    this.devicesService.streamsUpdated.subscribe(
      (streams) => this.streams = streams
    );

    this.stream_selected = this.streamSelect();
  }

  streamSelect() {
    if (this.streams.length > 0)
      return this.streams[0];
    else
      return null;
  };

  deleteStream(stream) {
    this.devicesService.deleteStream(stream).subscribe();
    this.stream_selected = this.streamSelect();
  };

  addStream(name) {
    var stream = new Stream();
    stream.name = name;
    this.devicesService.addStream(stream).subscribe(stream => this.streams.push(stream));
  };

  updateStream(stream) {
    this.devicesService.updateStream(stream).subscribe();
  };
}

