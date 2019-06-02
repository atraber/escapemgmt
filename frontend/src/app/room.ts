/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Booking} from './booking';
import {Score} from './score';

export class Room {
  id: number;
  name: string;
  description: string;
  profile_image: string;
  bg_image: string;
  bookings: Booking[];
  scores: Score[];

  constructor () {
    this.name = "";
    this.description = "";
    this.profile_image = "";
    this.bg_image = "";
    this.bookings = [];
    this.scores = [];
  }
}
