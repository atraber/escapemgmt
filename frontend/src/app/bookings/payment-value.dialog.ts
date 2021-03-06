/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {AfterViewInit, Component, Inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import AutoNumeric from 'autonumeric';

export class PaymentValueRequest {
  title: string;
  descriptionRequired: boolean;
}

export class PaymentValueResponse {
  description: string;
  amount: number;
}

@Component({
  templateUrl : './payment-value.dialog.html',
  styleUrls : [ './payment-value.dialog.scss' ]
})
export class PaymentValueDialog implements AfterViewInit {
  title = "Title";
  descriptionRequired = true;
  amount: number;
  amountAN: AutoNumeric;
  description: string;

  constructor(public dialogRef: MatDialogRef<PaymentValueDialog>,
              @Inject(MAT_DIALOG_DATA) public data: PaymentValueRequest) {
    this.title = data.title;
    this.descriptionRequired = data.descriptionRequired;
  }

  ngAfterViewInit() {
    this.amountAN = new AutoNumeric('input.autonumeric');
    // @ts-ignore
    this.amountAN.swiss();
  }

  submit() {
    let response = new PaymentValueResponse();
    response.description = this.description;
    response.amount = this.amountAN.getNumber();
    this.dialogRef.close(response);
  }
}
