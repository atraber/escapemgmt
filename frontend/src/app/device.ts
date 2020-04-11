/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Preset} from './preset';
import {PresetGroup} from './preset-group';
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
  presetGroup?: PresetGroup;
  preset_group_id: number;

  constructor() {
    this.name = "";
    this.mac = "";
    this.screen_enable = true;
    this.last_seen = 0;
    this.streams = [];
    this.device_streams = [];
  }

  static toJSON(device: Device): any {
    let d = {
      id : device.id,
      name : device.name,
      mac : device.mac,
      screen_enable : device.screen_enable,
      last_seen : device.last_seen,
      device_streams : device.device_streams,
      preset_group_id : device.preset_group_id,
    };
    if (device.presetGroup != null) {
      d['preset_group_id'] = device.presetGroup.id;
    }
    return JSON.stringify(d);
  }
}
