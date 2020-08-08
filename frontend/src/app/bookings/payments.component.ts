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

class Item {
  name: string;
  price: number;

  constructor(name: string, price: number) {
    this.name = name;
    this.price = price;
  }
}

@Component({
  templateUrl : './payments.component.html',
  styleUrls : [ './payments.component.scss' ]
})
export class PaymentsComponent {
  loaded = false;
  itemsDataSource = new MatTableDataSource<Item>();
  items2DataSource = new MatTableDataSource<Item>();

  constructor(private bookingsService: BookingsService,
              private dialog: MatDialog) {
    this.loaded = true;
    this.itemsDataSource.data = [
      new Item('Raum 1', 100),
      new Item('Raum 2', 120),
      new Item('Cola', 3.50),
      new Item('Bier', 2.10),
    ];

    this.items2DataSource.data = [
      new Item('Cash', -50),
      new Item('Credit Card', -20),
    ];
  }

  openCreditCardDialog() {
    this.dialog.open(PaymentValueDialog, {width : '500px'});
  }
}

@Component({
  templateUrl : './payment-value.dialog.html',
  styleUrls : [ './payment-value.dialog.scss' ]
})
export class PaymentValueDialog {
  constructor(public dialogRef: MatDialogRef<BookingCreateDialog>) {}
}
