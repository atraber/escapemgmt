/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {ChangeDetectorRef, Component} from '@angular/core';
import {MatCarousel, MatCarouselComponent} from '@ngmodule/material-carousel';
import {timer} from 'rxjs/observable/timer';

import {Room} from '../room';
import {RoomsService} from './rooms.service';

@Component({
  templateUrl: './frontscreen.component.html',
  styleUrls: ['./frontscreen.component.css']
})
export class FrontscreenComponent {
  rooms: Room[] = [];

  constructor(
      private cdr: ChangeDetectorRef,
      private roomsService: RoomsService) {
    this.rooms = this.roomsService.rooms;

    this.roomsService.roomsUpdated.subscribe((rooms) => {
      this.rooms = rooms;
    });
  }

  ngOnInit() {}

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }
}