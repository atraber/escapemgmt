/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar} from '@angular/material';
import {ScoresService} from '../scores.service';
import {Room} from '../room';

@Component({
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css']
})
export class RoomsComponent {
  rooms: Room[];

  constructor(
    private scoresService: ScoresService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) {
    this.rooms = this.scoresService.rooms;

    this.scoresService.roomsUpdated.subscribe(
      (rooms) => this.rooms = rooms
    );
  }

  updateRoom(room): void {
    this.scoresService.updateRoom(room).subscribe(() => {
      this.snackBar.open('Room was saved', 'Hide', {
        duration: 2000,
      });
    }, err => {
      this.snackBar.open('Failed to update room. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }

  deleteRoom(room): void {
    this.scoresService.deleteRoom(room).subscribe(() => {
      this.snackBar.open('Room was deleted', 'Hide', {
        duration: 2000,
      });
    }, err => {
      this.snackBar.open('Failed to delete room. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }

  deleteRoomDialog(room): void {
    const dialogRef = this.dialog.open(RoomsDeleteDialog, {
      width: '500px',
      data: room
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed. Deleting the room.');
      this.deleteRoom(result);
    });
  }
}

@Component({
  selector: 'rooms-delete-dialog',
  templateUrl: 'rooms-delete-dialog.html',
})
export class RoomsDeleteDialog {
  constructor(
    public dialogRef: MatDialogRef<RoomsDeleteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Room) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}