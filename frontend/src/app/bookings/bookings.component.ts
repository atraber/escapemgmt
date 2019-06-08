/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar, MatTableDataSource} from '@angular/material';
import * as moment from 'moment';

import {Booking} from '../booking';
import {Room} from '../room';
import {ScoresService} from '../scores.service';

@Component({
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss']
})
export class BookingsComponent {
  rooms: Room[];
  bookings: Booking[];
  bookingsDataSource = new MatTableDataSource<Booking>();

  constructor(
    private scoresService: ScoresService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) {
    this.rooms = this.scoresService.rooms;

    this.scoresService.roomsUpdated.subscribe(
      (rooms) => this.rooms = rooms
    );

    this.generate();
  }

  private generate(): void {
    this.bookings = [
      new Booking(),
      new Booking(),
      new Booking(),
    ];
    this.bookings[0].id = 0;
    this.bookings[0].name = 'Andy';
    this.bookings[0].room = this.rooms[0];
    this.bookings[0].slot_from = moment("2019-06-08T12:00", "YYYY-MM-DDTh:m").unix();
    this.bookings[0].slot_to = moment("2019-06-08T12:45", "YYYY-MM-DDTh:m").unix();
    this.bookings[1].id = 1;
    this.bookings[1].name = 'Someone';
    this.bookings[0].room = this.rooms[2];
    this.bookings[1].slot_from = moment("2019-06-08T14:00", "YYYY-MM-DDTh:m").unix();
    this.bookings[1].slot_to = moment("2019-06-08T14:45", "YYYY-MM-DDTh:m").unix();
    this.bookings[2].id = 2;
    this.bookings[2].name = 'Dom';
    this.bookings[0].room = this.rooms[2];
    this.bookings[2].slot_from = moment("2019-06-08T13:00", "YYYY-MM-DDTh:m").unix();
    this.bookings[2].slot_to = moment("2019-06-08T13:45", "YYYY-MM-DDTh:m").unix();
    this.bookingsDataSource.data = this.bookings;
  }

  formatDatetime(time: number): string {
    // Need to multiply with 1000 to get from seconds to millis which is used
    // by JavaScript by default.
    return moment(time * 1000).format('LLL');
  }
}
