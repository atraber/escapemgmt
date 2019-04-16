/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {MatSnackBar} from '@angular/material';

import {ScoresService} from '../scores.service';
import {Room} from '../room';

@Component({
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class RoomCreateComponent {
  room: Room;

  constructor(
    private scoresService: ScoresService,
    private snackBar: MatSnackBar) {
    this.room = new Room();
  }

  addRoom(room): void {
    console.log(room);
    this.scoresService.addRoom(room).subscribe(() => {
      this.snackBar.open('New Room was created', 'Hide', {
        duration: 2000,
      });
    }, err => {
      this.snackBar.open('Failed to create room. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }
}
