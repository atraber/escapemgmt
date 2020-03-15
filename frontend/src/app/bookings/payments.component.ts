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
  templateUrl : './payments.component.html',
  styleUrls : [ './payments.component.scss' ]
})
export class PaymentsComponent {
  loaded = false;

  constructor(private bookingsService: BookingsService,
              private dialog: MatDialog) {}
}
