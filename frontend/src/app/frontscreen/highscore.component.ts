/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';

import {environment} from '../../environments/environment';
import {Room} from '../room';
import {RoomsService} from './rooms.service';

@Component({
  selector: 'carousel-highscore',
  templateUrl: './highscore.component.html',
  styleUrls: ['./highscore.component.scss']
})
export class HighscoreComponent {
  rooms: Room[];

  constructor(private roomsService: RoomsService) {
    this.rooms = this.filterRooms(this.roomsService.rooms);

    this.roomsService.roomsUpdated.subscribe(rooms => {
      this.rooms = this.filterRooms(rooms);
    });
  }

  private filterRooms(rooms: Room[]) {
    for (let room of rooms) {
      if (room.scores.length > 5)
        room.scores = room.scores.slice(0, 5);
    }

    return rooms;
  }

  imagePath(path): string {
    return environment.apiEndpoint + '/file/' + path;
  }
}