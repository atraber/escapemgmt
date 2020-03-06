/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
export class StreamView {
  id: number;
  url: string;
  crop_x1: number;
  crop_x2: number;
  crop_y1: number;
  crop_y2: number;

  // TODO: Remove this. Make the preview thing a separate component and save
  // all info there instead.
  frontend_width: number|null;
  frontend_height: number|null;
  frontend_url: string|null;
}
