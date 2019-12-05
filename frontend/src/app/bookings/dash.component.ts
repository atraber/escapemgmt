/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar} from '@angular/material';
import * as moment_ from 'moment';

const moment = moment_;

import {Booking} from '../booking';
import {BookingsService} from '../bookings.service';

@Component({
  templateUrl: './dash.component.html',
  styleUrls: ['./dash.component.scss']
})
export class BookingsDashComponent {
  recentBookings: Booking[] = [];
  currentBookings: Booking[] = [];
  upcomingBookings: Booking[] = [];

  constructor(
    private bookingsService: BookingsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) {
    this.filterAndSortBookings(this.bookingsService.bookings);

    this.bookingsService.bookingsUpdated.subscribe((bookings) => {
      this.filterAndSortBookings(bookings);
    });
  }

  private filterAndSortBookings(bookings: Booking[]) {
    let now = moment();

    // Only keep bookings that are relevant for us
    let filtered = bookings.filter((e) => {
      let from = moment(e.slot_from * 1000);
      let to = moment(e.slot_to * 1000);

      // Ignore bookings that have ended more than 12 hours ago
      if (from.add(12, 'hours') < now)
        return false;

      // Ignore bookings that start in more than 12 hours
      if (to.subtract(12, 'hours') > now)
        return false;

      return true;
    });

    // Sort them by time
    let sorted = filtered.sort((b1, b2) => {
      return b1.slot_from - b2.slot_from;
    });

    // Perform bining, aka. push bookings into recent, current or upcoming
    // bookings bins.
    let recent: Booking[] = [];
    let current: Booking[] = [];
    let upcoming: Booking[] = [];

    for (let e of sorted) {
      let from = moment(e.slot_from * 1000);
      let to = moment(e.slot_to * 1000);

      if (to < now) {
        recent.push(e);
      } else if (from > now) {
        upcoming.push(e);
      } else {
        current.push(e);
      }
    }

    // Apply changes
    this.recentBookings = recent;
    this.currentBookings = current;
    this.upcomingBookings = upcoming;
  }
}
