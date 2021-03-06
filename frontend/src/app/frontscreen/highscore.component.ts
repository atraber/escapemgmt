/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import moment from 'moment';

import {environment} from '../../environment';
import {EntityUtils} from '../entity-utils';
import {Room} from '../room';
import {Score} from '../score';

import {RoomsService} from './rooms.service';

@Component({
  selector : 'carousel-highscore',
  templateUrl : './highscore.component.html',
  styleUrls : [ './highscore.component.scss' ]
})
export class HighscoreComponent {
  rooms: Room[];

  constructor(private roomsService: RoomsService) {
    this.rooms = this.filterRooms(this.roomsService.rooms);

    this.roomsService.roomsUpdated.subscribe(
        rooms => { this.rooms = this.filterRooms(rooms); });
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

  imagePath(room: Room): string {
    return EntityUtils.getRoomProfileImage(room);
  }

  formatTime(time: number): string {
    let m = moment.duration(time * 1000);
    let hours = m.hours();
    let minutes = m.minutes();

    let hours_str: string = hours.toString();
    if (hours < 10)
      hours_str = '0' + hours_str;

    let minutes_str: string = minutes.toString();
    if (minutes < 10)
      minutes_str = '0' + minutes_str;
    return hours_str + ':' + minutes_str;
  }

  formatDate(time: number): string {
    return moment.utc(time * 1000).format('DD.MM.YYYY')
  }
}