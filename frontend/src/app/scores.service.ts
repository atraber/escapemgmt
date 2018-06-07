/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Room } from './room';
import { Score } from './score';

const jsonOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json',
  })
};

@Injectable()
export class ScoresService {
  rooms: Room[];

  roomsUpdated: EventEmitter<Room[]> = new EventEmitter();

  constructor(private http: HttpClient) {
    this.rooms = [];

    this.http.get<Room[]>(environment.apiEndpoint + '/rooms')
      .subscribe(rooms => {this.rooms = rooms; this.roomsUpdated.emit(rooms)});
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an ErrorObservable with a user-facing error message
    return new ErrorObservable(
      'Something bad happened; please try again later.');
  };

  addRoom(room: Room): Observable<Room> {
    return this.http.post<Room>(environment.apiEndpoint + '/room', room, jsonOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateRoom(room: Room): Observable<Room> {
    this.roomsUpdated.emit(this.rooms)
    return this.http.post<Room>(environment.apiEndpoint + '/rooms/' + room.id, room, jsonOptions)
      .pipe(
        catchError(this.handleError)
      );
  };

  deleteRoom(room: Room): Observable<{}> {
    var index = this.rooms.indexOf(room);
    this.rooms.splice(index, 1);
    this.roomsUpdated.emit(this.rooms)
    return this.http.delete(environment.apiEndpoint + '/rooms/' + room.id, jsonOptions)
      .pipe(
        catchError(this.handleError)
      );
  };

  addScoreToRoom(room: Room, score: Score): Observable<{Score}> {
    return this.http.post<Score>(environment.apiEndpoint + '/rooms/' + room.id + '/score', score, jsonOptions)
      .pipe(
        catchError(this.handleError)
      );
  };

  deleteScoreFromRoom(room: Room, score: Score): Observable<{}> {
    var index = room.scores.indexOf(score);
    room.scores.splice(index, 1);
    this.roomsUpdated.emit(this.rooms)
    return this.http.delete(environment.apiEndpoint + '/rooms/' + room.id + '/scores/' + score.id, jsonOptions)
      .pipe(
        catchError(this.handleError)
      );
  };
}
