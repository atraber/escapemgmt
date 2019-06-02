/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar} from '@angular/material';

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

  constructor(
    private scoresService: ScoresService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) {
    this.rooms = this.scoresService.rooms;

    this.scoresService.roomsUpdated.subscribe(
      (rooms) => this.rooms = rooms
    );
  }
}
