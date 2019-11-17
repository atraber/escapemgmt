/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Input} from '@angular/core';

import {environment} from '../../environments/environment';
import {Room} from '../room';

@Component({
  templateUrl: './roomslide.component.html',
  styleUrls: ['./roomslide.component.scss'],
  selector: 'room-slide',
})
export class RoomSlideComponent {
  @Input() room: Room;

  imagePath(path): string {
    return environment.apiEndpoint + '/file/' + path;
  }
}