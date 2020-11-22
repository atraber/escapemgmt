/**
 * Copyright 2012 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Pipe, PipeTransform} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import AutoNumeric from 'autonumeric';

import {NavService} from '../nav.service';

import {PaymentBookingsDialog} from './payment-bookings.dialog';
import {PaymentSnackGalleryDialog} from './payment-snack-gallery.dialog';
import {PaymentValueDialog, PaymentValueRequest} from './payment-value.dialog';
import {PaymentVoucherDialog} from './payment-voucher.dialog';

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
  displayedColumns: string[] = [ 'description', 'price', 'controls' ];

  constructor(private dialog: MatDialog, private navService: NavService) {
    this.loaded = true;
    this.articlesDataSource.data = [
      new Item('Raum 1', 100),
      new Item('Raum 2', 120),
      new Item('Cola', 3.50),
      new Item('Bier', 2.10),
    ];

    this.receivedDataSource.data = [
      new Item('Bar', 50),
      new Item('Karte', 20),
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
      this.receivedDataSource.data.push(new Item('Credit Card', result.amount));
      // The following call is necessary for the table to notice the changes.
      this.receivedDataSource.data = this.receivedDataSource.data;
    });
  }

  openCashDialog() {
    let ref = this.openPaymentValueDialog('Cash', false);
    ref.afterClosed().subscribe(result => {
      this.receivedDataSource.data.push(new Item('Bar', result.amount));
      // The following call is necessary for the table to notice the changes.
      this.receivedDataSource.data = this.receivedDataSource.data;
    });
  }

  openDiscountDialog() {
    let ref = this.openPaymentValueDialog('Discount', false);
    ref.afterClosed().subscribe(result => {
      this.articlesDataSource.data.push(new Item('Rabatt', -result.amount));
      // The following call is necessary for the table to notice the changes.
      this.articlesDataSource.data = this.articlesDataSource.data;
    });
  }

  openVoucherDialog() {
    let ref = this.dialog.open(PaymentVoucherDialog, {width : '500px'});
    ref.afterClosed().subscribe(result => {
      this.receivedDataSource.data.push(
          new Item('Gutschein fuer ' + result + ' Personen', result * 15));
      // The following call is necessary for the table to notice the changes.
      this.receivedDataSource.data = this.receivedDataSource.data;
    });
  }

  openSnackGalleryDialog() {
    // A la Migros Kasse
    let ref = this.dialog.open(PaymentSnackGalleryDialog, {width : '100%'});
    ref.afterClosed().subscribe(result => {
      this.articlesDataSource.data.push(
          new Item(result.description, result.amount));
      // The following call is necessary for the table to notice the changes.
      this.articlesDataSource.data = this.articlesDataSource.data;
    });
  }

  openBookingDialog() {
    this.dialog.open(PaymentBookingsDialog, {width : '500px'});
  }

  private openPaymentValueDialog(title: string, descriptionRequired: boolean):
      MatDialogRef<PaymentValueDialog, any> {
    let req = new PaymentValueRequest();
    req.title = title;
    req.descriptionRequired = descriptionRequired;
    return this.dialog.open(PaymentValueDialog, {width : '500px', data : req});
  }

  total(ds: MatTableDataSource<Item>): number {
    let total = 0.0;
    for (let i of ds.data) {
      total += i.price;
    }
    return total;
  }

  deleteItem(ds: MatTableDataSource<Item>, item: Item) {
    let index = ds.data.indexOf(item);
    ds.data.splice(index, 1);
    // The following call is necessary for the table to notice the changes.
    ds.data = ds.data;
  }

  submit() {
    if (this.total(this.articlesDataSource).toFixed(2) !=
        this.total(this.receivedDataSource).toFixed(2)) {
      this.dialog.open(PaymentMessageDialog, {width : '500px'});
      return;
    }

    // add transaction
    this.navService.message(
        'Would have saved transaction, if we had a backend.');
  }
}

@Pipe({name : 'AN'})
export class AutoNumericPipe implements PipeTransform {
  transform(value: number): string {
    return AutoNumeric.format(value, AutoNumeric.getPredefinedOptions().Swiss);
  }
}

@Component({
  templateUrl : 'payment-message.dialog.html',
  styleUrls : [ './payment-message.dialog.scss' ]
})
export class PaymentMessageDialog {
}
