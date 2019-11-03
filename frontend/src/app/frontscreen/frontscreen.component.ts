/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {timer} from 'rxjs/observable/timer';

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
      private roomsService: RoomsService) {
    this.rooms = this.roomsService.rooms;

    this.roomsService.roomsUpdated.subscribe((rooms) => {
      this.rooms = rooms;
    });
  }

  imagePath(path): string {
    return environment.apiEndpoint + '/file/' + path;
  }
}