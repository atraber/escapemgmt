import { Stream } from './stream';

export class Device {
  id: number;
  name: string;
  mac: string;
  screen_enable: Boolean;
  last_seen: number;
  streams: Stream[];

  constructor () {
    this.name = "";
    this.mac = "";
    this.screen_enable = true;
    this.last_seen = 0;
    this.streams = [];
  }
}
