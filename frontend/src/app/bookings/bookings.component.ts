/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import moment from 'moment';

import {Booking, BookingSource} from '../booking';
import {BookingsService} from '../bookings.service';
import {BookingCreateDialog} from './booking-create.dialog';

@Component({
  templateUrl : './bookings.component.html',
  styleUrls : [ './bookings.component.scss' ]
})
export class BookingsComponent implements OnInit {
  dataSource = new MatTableDataSource<Booking>();
  @ViewChild(MatPaginator, {static : true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static : true}) sort: MatSort;
  loaded = false;
  BOOKING_SOURCE_MANUAL = BookingSource.MANUAL;

  constructor(private bookingsService: BookingsService,
              private dialog: MatDialog) {}

  ngOnInit() {
    this.dataSource.data = this.bookingsService.bookings;
    this.loaded = this.bookingsService.loaded;

    this.bookingsService.bookingsUpdated.subscribe((bookings) => {
      this.dataSource.data = bookings;
      this.loaded = this.bookingsService.loaded;
    });
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.sort.active = 'slot_from';
    this.sort.direction = 'desc';
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  formatDatetime(time: number): string {
    // Need to multiply with 1000 to get from seconds to millis which is used
    // by JavaScript by default.
    return moment(time * 1000).format('LL LT');
  }

  formatEndTime(time: number): string {
    // Need to multiply with 1000 to get from seconds to millis which is used
    // by JavaScript by default.
    return moment(time * 1000).format('LT');
  }

  addBookingDialog() {
    this.dialog.open(BookingCreateDialog, {width : '500px'});
  }

  editBookingDialog(booking: Booking) {}
  deleteBookingDialog(booking: Booking) {}
}
