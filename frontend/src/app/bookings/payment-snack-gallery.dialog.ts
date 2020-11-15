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
  templateUrl : './payment-snack-gallery.dialog.html',
  styleUrls : [ './payment-snack-gallery.dialog.scss' ]
})
export class PaymentSnackGalleryDialog {
  tiles: Tile[] = [];

  constructor(public dialogRef: MatDialogRef<PaymentSnackGalleryDialog>) {
    let image = 'https://material.angular.io/assets/img/examples/shiba2.jpg';
    this.tiles.push({title : 'Foobar', price : 5.20, image : image});
    this.tiles.push({title : 'Foobar', price : 5.20});
    this.tiles.push({title : 'Foobar', price : 5.20});
  }

  add(tile: Tile) {
    this.dialogRef.close({description : tile.title, amount : tile.price});
  }

  submit() { this.dialogRef.close(); }
}
