/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {AfterViewInit, Component, HostListener, ViewChild} from '@angular/core';
import {MatDrawer} from '@angular/material';
import {Router} from '@angular/router';

import {NavService} from './nav.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  _router: any;
  @ViewChild(MatDrawer)
  private snav: MatDrawer;

  constructor(
      private navService: NavService,
      private router: Router) {
    this._router = router;
  }

  ngAfterViewInit(): void {
    this.snav.opened = this.navService.isOpened;

    this.onResize(null);
  }

  snavToggle(): void {
    this.navService.toggle();
    this.snav.opened = this.navService.isOpened;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (window.innerWidth < 700) {
      this.snav.mode = 'over';
    } else {
      this.snav.mode = 'side';
    }
  }
}
