/**
 * Copyright 2020 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import {Booking} from '../booking';
import {BookingsService} from '../bookings.service';
import {Room} from '../room';
import {ScoresService} from '../scores.service';

@Component({
  templateUrl : './booking-create.dialog.html',
  styleUrls : [ './booking-create.dialog.scss' ]
})
export class BookingCreateDialog {
  booking: Booking = new Booking();
  booking_date = null;
  booking_time = null;
  booking_slot_length = null;
  rooms: Room[] = [];
  loaded = false;

  constructor(public dialogRef: MatDialogRef<BookingCreateDialog>,
              private bookingsService: BookingsService,
              private scoresService: ScoresService,
              private snackBar: MatSnackBar) {
    this.scoresService.roomsUpdated.subscribe((rooms) => {
      this.rooms = rooms;
      this.loaded = this.scoresService.loaded;
    });

    this.rooms = this.scoresService.rooms;
    this.loaded = this.scoresService.loaded;
  }

  addBooking(): void {
    // TODO: UNFINISHED!
    this.booking.slot_from = null;
    this.booking.slot_to = null;
    this.bookingsService.addBooking(this.booking)
        .subscribe(
            () => {
              this.snackBar.open('New Booking was created', 'Hide', {
                duration : 2000,
              });
              this.dialogRef.close();
            },
            err => {
              this.snackBar.open('Failed to create booking. Please try again!',
                                 'Hide', {
                                   duration : 2000,
                                 });
            });
  }
}
