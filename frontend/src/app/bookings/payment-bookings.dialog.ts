/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';

interface Tile {
  title: string;
  image?: string;
  price: number;
}

@Component({
  templateUrl : './payment-bookings.dialog.html',
  styleUrls : [ './payment-bookings.dialog.scss' ]
})
export class PaymentBookingsDialog {
  constructor(public dialogRef: MatDialogRef<PaymentBookingsDialog>) {}
}
