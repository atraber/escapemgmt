/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';

import {Booking} from '../booking';
import {Room} from '../room';

@Component({
  templateUrl: './dash.component.html',
  styleUrls: ['./dash.component.scss']
})
export class BookingsDashComponent {
  rooms: Room[];
  bookings: Booking[];

  constructor() {
  }
}
