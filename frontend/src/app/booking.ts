/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Room} from './room';

export class Booking {
  id: number;
  name: string;
  created_at: number;
  room: Room;
  slot_from: number;
  slot_to: number;

  constructor () {
    this.name = "";
    this.created_at = 0;
    this.room = null;
    this.slot_from = 0;
    this.slot_to = 0;
  }
}
