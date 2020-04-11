/**
 * Copyright 2020 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Preset} from './preset';

export class PresetGroup {
  id: number;
  name: string;
  presets?: Preset[];

  static toJSON(pg: PresetGroup): any {
    return JSON.stringify({
      id : pg.id,
      name : pg.name,
    });
  }
}
