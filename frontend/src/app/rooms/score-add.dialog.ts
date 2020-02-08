/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {
  Component,
  Inject,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import {Room} from '../room';
import {Score} from '../score';
import {ScoresService} from '../scores.service';

@Component({
  selector : 'score-add-dialog',
  templateUrl : 'score-add.dialog.html',
  styles : [ `
    .score-form-container {
      display: flex;
      flex-direction: column;
      margin-right: 180px;
    }
  ` ],
})
export class ScoreAddDialog {
  room: Room;
  score: Score;

  constructor(public dialogRef: MatDialogRef<ScoreAddDialog>,
              private scoresService: ScoresService,
              private snackBar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data: Room) {
    this.room = data;
    this.score = new Score();
  }

  addScoreToRoom(room: Room, score: Score): void {
    this.scoresService.addScoreToRoom(room, score)
        .subscribe(
            () => {
              this.snackBar.open('Score was added', 'Hide', {
                duration : 2000,
              });
              this.dialogRef.close();
            },
            err => {
              this.snackBar.open('Failed to add score. Please try again!',
                                 'Hide', {
                                   duration : 2000,
                                 });
            });
  }
}
