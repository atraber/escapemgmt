/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Injectable} from '@angular/core';

@Injectable()
export class NavService {
  isOpened: boolean = false;

  constructor() {
    if (window.innerWidth > 700) {
      this.isOpened = true;
    }
  }

  toggle(): void {
    this.isOpened = !this.isOpened;
  }

  setOpen(opened: boolean): void {
    this.isOpened = opened;
  }
}
