/**
 * Copyright 2012 Andreas Traber
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
import AutoNumeric from 'autonumeric';
import moment from 'moment';

import {Booking, BookingSource} from '../booking';
import {BookingsService} from '../bookings.service';

import {BookingCreateDialog} from './booking-create.dialog';
import {PaymentValueDialog, PaymentValueRequest} from './payment-value.dialog';

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
  articlesDataSource = new MatTableDataSource<Item>();
  receivedDataSource = new MatTableDataSource<Item>();

  constructor(private bookingsService: BookingsService,
              private dialog: MatDialog) {
    this.loaded = true;
    this.articlesDataSource.data = [
      new Item('Raum 1', 100),
      new Item('Raum 2', 120),
      new Item('Cola', 3.50),
      new Item('Bier', 2.10),
    ];

    this.receivedDataSource.data = [
      new Item('Bar', -50),
      new Item('Karte', -20),
    ];
  }

  openAmountDialog() {
    let ref = this.openPaymentValueDialog('Amount', true);
    ref.afterClosed().subscribe(result => {
      this.articlesDataSource.data.push(
          new Item(result.description, result.amount));
      // The following call is necessary for the table to notice the changes.
      this.articlesDataSource.data = this.articlesDataSource.data;
    });
  }

  openCreditCardDialog() {
    let ref = this.openPaymentValueDialog('Credit Card', false);
    ref.afterClosed().subscribe(result => {
      this.receivedDataSource.data.push(
          new Item('Credit Card', -result.amount));
      // The following call is necessary for the table to notice the changes.
      this.receivedDataSource.data = this.receivedDataSource.data;
    });
  }

  openCashDialog() {
    let ref = this.openPaymentValueDialog('Cash', false);
    ref.afterClosed().subscribe(result => {
      this.receivedDataSource.data.push(new Item('Bar', -result.amount));
      // The following call is necessary for the table to notice the changes.
      this.receivedDataSource.data = this.receivedDataSource.data;
    });
  }

  private openPaymentValueDialog(title: string, descriptionRequired: boolean):
      MatDialogRef<PaymentValueDialog, any> {
    let req = new PaymentValueRequest();
    req.title = title;
    req.descriptionRequired = descriptionRequired;
    return this.dialog.open(PaymentValueDialog, {width : '500px', data : req});
  }
}
