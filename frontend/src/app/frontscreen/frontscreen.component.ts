/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {ChangeDetectorRef, Component} from '@angular/core';
import {MatCarousel, MatCarouselComponent} from '@ngmodule/material-carousel';

import {environment} from '../../environments/environment';
import {Room} from '../room';
import {RoomsService} from './rooms.service';

@Component({
  templateUrl: './frontscreen.component.html',
  styleUrls: ['./frontscreen.component.scss']
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

  imagePath(path): string {
    return environment.apiEndpoint + '/file/' + path;
  }
}