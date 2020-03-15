/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import moment from 'moment';
import {timer} from 'rxjs';

import {Booking} from '../booking';
import {BookingsService} from '../bookings.service';

@Component({
  templateUrl : './dash.component.html',
  styleUrls : [ './dash.component.scss' ]
})
export class BookingsDashComponent {
  bookings: Booking[] = [];
  loaded = false;

  constructor(private bookingsService: BookingsService,
              private dialog: MatDialog, private snackBar: MatSnackBar) {
    this.filterAndSortBookings(this.bookingsService.bookings);
    this.loaded = this.bookingsService.loaded;

    this.bookingsService.bookingsUpdated.subscribe((bookings) => {
      this.filterAndSortBookings(bookings);
      this.loaded = this.bookingsService.loaded;
    });

    // Update the displayed list every minute.
    let t = timer(0, 60 * 1000);
    t.subscribe(
        t => { this.filterAndSortBookings(this.bookingsService.bookings); });
  }

  private filterAndSortBookings(bookings: Booking[]) {
    let now = moment();

    // We are looking for bookings between 4am today and 4am the next day.
    let cutoff_day_str = moment().subtract(4, 'hours').format('YYYY-MM-DD');
    let cutoff_start = moment(cutoff_day_str).add(4, 'hours');
    let cutoff_end = moment(cutoff_day_str).add(28, 'hours');

    // Only keep bookings that are relevant for us.
    let filtered = bookings.filter((e) => {
      let from = moment(e.slot_from * 1000);
      let to = moment(e.slot_to * 1000);

      return from.isAfter(cutoff_start) && to.isBefore(cutoff_end);
    });

    // Sort them by time.
    let sorted =
        filtered.sort((b1, b2) => { return b1.slot_from - b2.slot_from; });

    this.bookings = sorted;
  }
}
