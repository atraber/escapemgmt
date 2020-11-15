/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';

@Component({
  templateUrl : './payment-voucher.dialog.html',
  styleUrls : [ './payment-voucher.dialog.scss' ]
})
export class PaymentVoucherDialog {
  numPeople: number;

  constructor(public dialogRef: MatDialogRef<PaymentVoucherDialog>) {}

  submit() { this.dialogRef.close(this.numPeople); }
}
