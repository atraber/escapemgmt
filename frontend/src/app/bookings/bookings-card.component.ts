/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject, Input} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import moment from 'moment';

import {Booking} from '../booking';

@Component({
  selector : 'bookings-card',
  templateUrl : './bookings-card.component.html',
  styleUrls : [ './bookings-card.component.scss' ]
})
export class BookingsCard {
  bookingsDataSource = new MatTableDataSource<Booking>();

  constructor() {}

  formatTime(time: number): string {
    // Need to multiply with 1000 to get from seconds to millis which is used
    // by JavaScript by default.
    return moment(time * 1000).format('HH:mm');
  }

  @Input()
  set bookings(bookings: Booking[]) {
    this.bookingsDataSource.data = bookings;
  }

  getIndicatorClassForBooking(booking: Booking): string {
    let now = moment();
    let from = moment(booking.slot_from * 1000);
    let to = moment(booking.slot_to * 1000);

    if (to < now) {
      return 'indicator-past';
    } else if (from > now) {
      return 'indicator-future';
    } else {
      return 'indicator-present';
    }
  }
}
