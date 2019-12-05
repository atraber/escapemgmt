/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject, Input} from '@angular/core';
import {MatTableDataSource} from '@angular/material';
import * as moment_ from 'moment';

const moment = moment_;

import {Booking} from '../booking';

@Component({
  selector: 'bookings-card',
  templateUrl: './bookings-card.component.html',
  styleUrls: ['./bookings-card.component.scss']
})
export class BookingsCard{
  bookingsDataSource = new MatTableDataSource<Booking>();

  constructor() {
  }

  formatTime(time: number): string {
    // Need to multiply with 1000 to get from seconds to millis which is used
    // by JavaScript by default.
    return moment(time * 1000).format('HH:mm');
  }

  @Input()
  set bookings(bookings: Booking[]) {
    this.bookingsDataSource.data = bookings;
  }
}
