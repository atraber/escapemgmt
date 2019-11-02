/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import * as moment from 'moment';

import {environment} from '../../environments/environment';
import {Room} from '../room';
import {RoomsService} from './rooms.service';
import {Score} from '../score';

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

  private rankScores(scores: Score[]): Score[] {
    let sorted = scores.sort((s1, s2) => s1.time - s2.time);
    for (let i = 0; i < sorted.length; i++) {
      sorted[i].rank = i + 1;
    }
    return sorted;
  }

  private getLatestScore(scores: Score[], max_age_secs: number): Score|null {
    if (scores.length > 0) {
      let sorted = scores.sort((s1, s2) => s2.created_at - s1.created_at);
      let latest_created_at = (sorted[0].created_at + max_age_secs);
      if (latest_created_at > parseInt(moment.utc().format('X')))
        return sorted[0];
    }

    return null;
  }

  private filterRooms(rooms: Room[]) {
    let filtered_rooms: Room[] = [];

    for (let room of rooms) {
      let filtered_room = new Room();
      filtered_room.name = room.name;
      filtered_room.profile_image = room.profile_image;

      let sorted = this.rankScores(room.scores)

      let top_scores: Score[] = [];
      if (sorted.length > 5) {
        top_scores = sorted.slice(0, 5);
        let latest = this.getLatestScore(sorted, 10 * 60);
        if (latest != null) {
          // Check if latest score is already part of top_scores.
          if (top_scores.indexOf(latest) == -1) {
            top_scores = top_scores.slice(0, 4);
            top_scores.push(latest);
          }
        }
      } else {
        top_scores = sorted;
      }
      filtered_room.scores = top_scores;

      filtered_rooms.push(filtered_room);
    }

    return filtered_rooms;
  }

  imagePath(path: string): string {
    return environment.apiEndpoint + '/file/' + path;
  }

  formatTime(time: number): string {
    return Math.floor(time/60) + ' min';
  }

  formatDate(time: number): string {
    return moment.utc(time * 1000).format('DD.MM.YYYY')
  }
}