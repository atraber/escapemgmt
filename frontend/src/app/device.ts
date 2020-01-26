/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Preset} from './preset';
import {Stream} from './stream';

export class DeviceStream {
  device_id: number;
  preset_id: number;
  stream_id: number;

  constructor() {
    this.device_id = null;
    this.preset_id = null;
    this.stream_id = null;
  }
}

export class Device {
  id: number;
  name: string;
  mac: string;
  screen_enable: Boolean;
  last_seen: number;
  streams: Stream[];
  device_streams: DeviceStream[];

  constructor() {
    this.name = "";
    this.mac = "";
    this.screen_enable = true;
    this.last_seen = 0;
    this.streams = [];
    this.device_streams = [];
  }
}
