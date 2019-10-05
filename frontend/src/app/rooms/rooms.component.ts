/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar} from '@angular/material';

import {environment} from '../../environments/environment';
import {FileBuffer} from './filebuffer';
import {FileUploadService} from './fileupload.service';
import {RoomCreateDialog} from './create.dialog';
import {ScoresService} from '../scores.service';
import {Room} from '../room';

@Component({
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent {
  rooms: Room[];

  constructor(
    private scoresService: ScoresService,
    private fileUploadService: FileUploadService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) {
    this.rooms = this.scoresService.rooms;

    this.scoresService.roomsUpdated.subscribe(
      (rooms) => this.rooms = rooms
    );
  }

  changeProfileImage(room: Room, file: File) {
    this.fileUploadService.upload(file).subscribe((resp) => {
      room.profile_image = resp;
      this.snackBar.open('File Upload successful', 'Hide', {
        duration: 2000,
      });
    }, err => {
      console.log(err);
      this.snackBar.open('Failed to upload file. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }

  changeBackgroundImage(room: Room, file: File) {
    this.fileUploadService.upload(file).subscribe((resp) => {
      room.bg_image = resp;
      this.snackBar.open('File Upload successful', 'Hide', {
        duration: 2000,
      });
    }, err => {
      console.log(err);
      this.snackBar.open('Failed to upload file. Please try again!', 'Hide', {
        duration: 2000,
      });
    });
  }

  addRoom(): void {
    const dialogRef = this.dialog.open(RoomCreateDialog, {
      width: '500px'
    });
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
      if (result != "") {
        console.log('The dialog was closed. Deleting the room.');
        this.deleteRoom(result);
      }
    });
  }

  imagePath(path): string {
    return environment.apiEndpoint + '/file/' + path;
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
}
