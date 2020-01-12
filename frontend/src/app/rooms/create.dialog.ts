/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import {Room} from '../room';
import {ScoresService} from '../scores.service';

@Component({
  templateUrl : './create.dialog.html',
  styleUrls : [ './create.dialog.scss' ]
})
export class RoomCreateDialog {
  room: Room = new Room();

  constructor(public dialogRef: MatDialogRef<RoomCreateDialog>,
              private scoresService: ScoresService,
              private snackBar: MatSnackBar) {}

  addRoom(room: Room): void {
    this.scoresService.addRoom(room).subscribe(
        () => {
          this.snackBar.open('New Room was created', 'Hide', {
            duration : 2000,
          });
          this.dialogRef.close();
        },
        err => {
          this.snackBar.open('Failed to create room. Please try again!', 'Hide',
                             {
                               duration : 2000,
                             });
        });
  }
}
