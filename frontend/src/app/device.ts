/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Preset} from './preset';
import {Stream} from './stream';

export class Device {
  id: number;
  name: string;
  mac: string;
  screen_enable: Boolean;
  last_seen: number;
  streams: Stream[];
  presets_used: Preset[];

  constructor () {
    this.name = "";
    this.mac = "";
    this.screen_enable = true;
    this.last_seen = 0;
    this.streams = [];
    this.presets_used = [];
  }
}
