/**
 * Copyright 2018-2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {StreamView} from './streamview';

export class Stream {
  id: number;
  name: string;
  orientation: number;
  streamviews: StreamView[];
}
