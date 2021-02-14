/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

// TODO(atraber): Frankly I don't understand Injectable...
//@Injectable()
export class NavService {
  isOpened: boolean = false;

  constructor(private snackBar: MatSnackBar) {
    if (window.innerWidth > 700) {
      this.isOpened = true;
    }
  }

  toggle(): void { this.isOpened = !this.isOpened; }

  setOpen(opened: boolean): void { this.isOpened = opened; }

  message(message: string, duration: number = 2000) {
    this.snackBar.open(message, 'Hide', {
      duration : duration,
    });
  }
}

export let navServiceProvider = {
  provide : NavService,
  useFactory : (snackBar: MatSnackBar) => { return new NavService(snackBar)},
  deps : [ MatSnackBar ]
};
