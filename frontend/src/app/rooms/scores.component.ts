/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTableDataSource} from '@angular/material/table';
import moment from 'moment';

import {Room} from '../room';
import {Score} from '../score';
import {ScoresService} from '../scores.service';

@Component({
  templateUrl : './scores.component.html',
  styleUrls : [ './scores.component.scss' ]
})
export class ScoresComponent {
  rooms: Room[] = [];
  roomSelected: Room = null;
  roomSelectedScoresDataSource = new MatTableDataSource<Score>();

  constructor(private scoresService: ScoresService, private dialog: MatDialog,
              private snackBar: MatSnackBar) {
    this.rooms = this.scoresService.rooms;
    this.selectRoom(null);

    this.scoresService.roomsUpdated.subscribe(rooms => {
      this.rooms = rooms;
      this.selectRoom(null);
    });
  }

  selectRoom(room: Room|null): void {
    if (room == null) {
      if (this.roomSelected == null && this.rooms.length > 0) {
        this.roomSelected = this.rooms[0];
      }
    } else {
      this.roomSelected = room;
    }

    if (this.roomSelected != null) {
      this.roomSelectedScoresDataSource.data = this.roomSelected.scores;
    }
  }

  formatDatetime(time: number): string {
    // Need to multiply with 1000 to get from seconds to millis which is used
    // by JavaScript by default.
    return moment(time * 1000).format('LLL');
  }

  formatTime(time: number): string {
    // Need to multiply with 1000 to get from seconds to millis which is used
    // by JavaScript by default.
    let seconds = Math.floor(moment.duration(time * 1000).asSeconds());
    let hours = Math.floor(seconds / 60 / 60);
    seconds -= hours * 60 * 60;
    let minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    let sec_s: string = seconds.toString();
    if (seconds < 10)
      sec_s = "0" + sec_s;
    let min_s: string = minutes.toString();
    if (minutes < 10)
      min_s = "0" + min_s;
    return hours + ":" + min_s + ":" + sec_s;
  }

  addScoreDialog(room: Room): void {
    const dialogRef =
        this.dialog.open(ScoreAddDialog, {width : '350px', data : room});

    dialogRef.afterClosed().subscribe(score => {
      if (score != undefined && score != "") {
        console.log('The dialog was closed. Adding new score');
        this.addScoreToRoom(room, score);
      }
    });
  }

  editScoreDialog(room: Room, score: Score): void {
    const dialogRef =
        this.dialog.open(ScoreEditDialog, {width : '350px', data : score});

    dialogRef.afterClosed().subscribe(score => {
      if (score != undefined && score != "") {
        console.log('The dialog was closed. Submitting edited score');
        // TODO
      }
    });
  }

  deleteScoreDialog(room: Room, score: Score): void {
    const dialogRef =
        this.dialog.open(ScoreDeleteDialog, {width : '350px', data : score});

    dialogRef.afterClosed().subscribe(score => {
      if (score != undefined && score != "") {
        console.log('The dialog was closed. Deleting score');
        this.deleteScoreFromRoom(room, score);
      }
    });
  }

  addScoreToRoom(room: Room, score: Score): void {
    this.scoresService.addScoreToRoom(room, score)
        .subscribe(
            () => {
              this.snackBar.open('Score was added', 'Hide', {
                duration : 2000,
              });
            },
            err => {
              this.snackBar.open('Failed to add score. Please try again!',
                                 'Hide', {
                                   duration : 2000,
                                 });
            });

    // Update table since it does not detect changes automatically
    this.roomSelectedScoresDataSource.data = this.roomSelected.scores;
  }

  deleteScoreFromRoom(room: Room, score: Score): void {
    this.scoresService.deleteScoreFromRoom(room, score)
        .subscribe(
            () => {
              this.snackBar.open('Score was deleted', 'Hide', {
                duration : 2000,
              });
            },
            err => {
              this.snackBar.open('Failed to delete score. Please try again!',
                                 'Hide', {
                                   duration : 2000,
                                 });
            });

    // Update table since it does not detect changes automatically
    this.roomSelectedScoresDataSource.data = this.roomSelected.scores;
  }
}

@Component({
  selector : 'score-add-dialog',
  templateUrl : 'score-add-dialog.html',
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
              @Inject(MAT_DIALOG_DATA) public data: Room) {
    this.room = data;
    this.score = new Score();
  }
}

@Component({
  selector : 'score-edit-dialog',
  templateUrl : 'score-edit-dialog.html',
})
export class ScoreEditDialog {
  score: Score;

  constructor(public dialogRef: MatDialogRef<ScoreEditDialog>,
              @Inject(MAT_DIALOG_DATA) public data: Score) {}
}

@Component({
  selector : 'score-delete-dialog',
  templateUrl : 'score-delete-dialog.html',
})
export class ScoreDeleteDialog {
  constructor(public dialogRef: MatDialogRef<ScoreDeleteDialog>,
              @Inject(MAT_DIALOG_DATA) public data: Score) {}
}
