/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Room} from './room';

export enum BookingSource {
  UNKNOWN = 0,
  WORDPRESS = 1,
  MANUAL = 2,
}

export class Booking {
  id: number;
  first_name: string;
  name: string;
  created_at: number;
  room: Room;
  slot_from: number;
  slot_to: number;
  source: BookingSource;

  constructor() {
    this.first_name = "";
    this.name = "";
    this.created_at = 0;
    this.room = null;
    this.slot_from = 0;
    this.slot_to = 0;
    this.source = BookingSource.UNKNOWN;
  }
}
