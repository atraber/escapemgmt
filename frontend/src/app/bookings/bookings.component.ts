/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, MatSort, MatTableDataSource} from '@angular/material';
import * as moment from 'moment';

import {Booking} from '../booking';
import {BookingsService} from '../bookings.service';

@Component({
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss']
})
export class BookingsComponent implements OnInit {
  dataSource = new MatTableDataSource<Booking>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private bookingsService: BookingsService) {
    this.dataSource.data = this.bookingsService.bookings;

    this.bookingsService.bookingsUpdated.subscribe((bookings) => {
      this.dataSource.data = bookings;
    });
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.sort.direction = 'desc';
    this.sort.active = 'slot_from';
    this.dataSource.sort = this.sort;
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
}
