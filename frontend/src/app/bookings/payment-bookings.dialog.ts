/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, OnInit} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {Booking} from '../booking';
import {BookingsService} from '../bookings.service';

@Component({
  templateUrl : './payment-bookings.dialog.html',
  styleUrls : [ './payment-bookings.dialog.scss' ]
})
export class PaymentBookingsDialog implements OnInit {
  loaded = false;
  bookingsDS = new MatTableDataSource<Booking>();
  displayedColumns: string[] = [ 'description', 'controls' ];

  constructor(private bookingsService: BookingsService,
              public dialogRef: MatDialogRef<PaymentBookingsDialog>) {}

  ngOnInit() {
    this.bookingsDS.data = this.bookingsService.bookings;
    this.loaded = this.bookingsService.loaded;

    this.bookingsService.bookingsUpdated.subscribe((bookings) => {
      this.bookingsDS.data = bookings;
      this.loaded = this.bookingsService.loaded;
    });
  }
}
