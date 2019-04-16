/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {ScoresService} from '../scores.service';
import {Room} from '../room';
import {Score} from '../score';
import * as moment from 'moment';

@Component({
  templateUrl: './scores.component.html',
  styleUrls: ['./scores.component.css']
})
export class ScoresComponent {
  rooms: Room[];

  constructor(private scoresService: ScoresService) {
    this.rooms = this.scoresService.rooms;

    this.scoresService.roomsUpdated.subscribe(
      (rooms) => this.rooms = rooms
    );
  }

  addScoreToRoom(room, name, time): void {
    var score = new Score();
    score.name = name;
    var m = moment.utc(time, ["HH:mm", "HH:mm:ss"]);
    m.year(1970);
    m.dayOfYear(1);
    score.time = parseInt(m.format("X"));
    this.scoresService.addScoreToRoom(room, score).subscribe(score => room.scores.push(score));
  }

  deleteScoreFromRoom(room, score): boolean {
    this.scoresService.deleteScoreFromRoom(room, score).subscribe();

    return false;
  }
}
