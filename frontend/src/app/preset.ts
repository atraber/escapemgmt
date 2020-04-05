/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Stream} from './stream';

declare class PresetGroup {};

export class Preset {
  id: number;
  name: string;
  active: boolean;
  streams: Stream[]|null; // Optional
  preset_group_id: number;
  presetGroup: PresetGroup|null; // Optional
}
