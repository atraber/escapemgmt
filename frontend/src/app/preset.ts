/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Stream} from './stream';

export class Preset {
  id: number;
  name: string;
  active: boolean;
  streams: Stream[]|null; // Optional
}
