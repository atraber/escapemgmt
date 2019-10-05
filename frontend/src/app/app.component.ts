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
  snavOpened: boolean = false;
  snavMode: string = 'side';
  @ViewChild('snav') snav: MatDrawer;

  constructor(
      private navService: NavService,
      private router: Router) {
    this._router = router;

    this.snavOpened = this.navService.isOpened;
    this.onResize(null);
  }

  ngAfterViewInit(): void {
    this.snav.openedChange.subscribe((opened) => {
      this.navService.setOpen(opened);
      this.snavOpened = this.navService.isOpened;
    });
  }


  snavToggle(): void {
    this.navService.toggle();
    this.snavOpened = this.navService.isOpened;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (window.innerWidth < 700) {
      this.snavMode = 'over';
    } else {
      this.snavMode = 'side';
    }
  }
}
