/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, OnInit} from '@angular/core';

import {environment} from '../../environment';
import {Room} from '../room';
import {RoomsService} from './rooms.service';

@Component({
  templateUrl : './frontscreen.component.html',
  styleUrls : [ './frontscreen.component.scss' ]
})
export class FrontscreenComponent implements OnInit {
  rooms: Room[] = [];

  constructor(private roomsService: RoomsService) {}

  ngOnInit() {
    this.rooms = this.roomsService.rooms;

    this.roomsService.roomsUpdated.subscribe((rooms) => {
      // TODO: Currently we do not care if old rooms have been deleted. This
      // does not happen often anyways.
      let oldMap = new Map();
      for (let r of this.rooms) {
        oldMap.set(r.id, r);
      }
      for (let r of rooms) {
        if (oldMap.has(r.id)) {
          let oldRoom = oldMap.get(r.id);
          // TODO: I call this an ugly hack...
          oldRoom.id = r.id;
          oldRoom.name = r.name;
          oldRoom.description = r.description;
          oldRoom.profile_image = r.profile_image;
          oldRoom.bg_image = r.bg_image;
          oldRoom.scores = r.scores;
          oldRoom.tags = r.tags;
        } else {
          this.rooms.push(r);
        }
      }
    });
  }

  imagePath(path): string { return environment.apiEndpoint + '/file/' + path; }
}