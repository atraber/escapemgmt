/**
 * Copyright 2209 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSelect} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';

import {Room} from '../room';
import {Score} from '../score';
import {ScoresService} from '../scores.service';

@Component({
  selector : 'score-edit-dialog',
  templateUrl : 'score-edit-dialog.html',
  styleUrls : [ 'score-edit.dialog.scss' ]
})
export class ScoreEditDialog {
  score: Score;
  room: Room;

  constructor(private scoresService: ScoresService,
              public dialogRef: MatDialogRef<ScoreEditDialog>,
              private snackBar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data) {
    this.score = data['score'];
    this.room = data['room'];
  }

  editScore(room: Room, score: Score): void {
    this.scoresService.updateScore(room, score)
        .subscribe(
            () => {
              this.snackBar.open('Score was saved.', 'Hide', {
                duration : 2000,
              });
              this.dialogRef.close();
            },
            err => {
              this.snackBar.open('Failed to save score. Please try again!',
                                 'Hide', {
                                   duration : 2000,
                                 });
            });
  }
}
