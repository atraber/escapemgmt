/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Input} from '@angular/core';

import {environment} from '../../environment';
import {Room} from '../room';

@Component({
  templateUrl: './roomslide.component.html',
  styleUrls: ['./roomslide.component.scss'],
  selector: 'room-slide',
})
export class RoomSlideComponent {
  descs: string[] = [];
  room_: Room = null;

  imagePath(path): string {
    return environment.apiEndpoint + '/file/' + path;
  }

  @Input()
  set room(room: Room) {
    this.room_ = room;
    this.descs = this.room_.description.split('\n');
  }

  get room(): Room|null {
    return this.room_;
  }
}