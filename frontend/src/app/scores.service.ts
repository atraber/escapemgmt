/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {catchError, retryWhen} from 'rxjs/operators';

import {environment} from '../environment';

import {NavService} from './nav.service';
import {Room} from './room';
import {saneRetryStrategy} from './rxjs-utils';
import {Score} from './score';

const jsonOptions = {
  headers : new HttpHeaders({
    'Content-Type' : 'application/json',
  })
};

@Injectable()
export class ScoresService {
  rooms: Room[] = [];

  loaded = false;
  roomsUpdated: EventEmitter<Room[]> = new EventEmitter();

  constructor(private http: HttpClient, private navService: NavService) {
    this.http.get<Room[]>(environment.apiEndpoint + '/rooms')
        .pipe(retryWhen(saneRetryStrategy(
            (msg: string): void => { this.navService.message(msg); })))
        .pipe(catchError(this.handleError))
        .subscribe(rooms => {
          this.rooms = rooms;
          this.loaded = true;
          this.roomsUpdated.emit(rooms);
        });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(`Backend returned code ${error.status}, ` +
                    `body was: ${error.error}`);
    }
    this.navService.message(
        'Failed to communicate with backend. Please try again later.');
    return throwError('Something bad happened; please try again later.');
  }

  addRoom(room: Room): Observable<Room> {
    return Observable.create(observer => {
      this.http.post<Room>(environment.apiEndpoint + '/room', room, jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              room => {
                observer.next(room);
                console.log(room);
                this.rooms.push(room);
                this.roomsUpdated.emit(this.rooms);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  updateRoom(room: Room): Observable<Room> {
    return Observable.create(observer => {
      this.http
          .post<Room>(environment.apiEndpoint + '/rooms/' + room.id, room,
                      jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              room => {
                observer.next(room);
                this.roomsUpdated.emit(this.rooms);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  deleteRoom(room: Room): Observable<{}> {
    return Observable.create(observer => {
      this.http
          .delete(environment.apiEndpoint + '/rooms/' + room.id, jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                let index = this.rooms.indexOf(room);
                this.rooms.splice(index, 1);
                this.roomsUpdated.emit(this.rooms);
                observer.next(null);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  addScoreToRoom(room: Room, score: Score): Observable<Score> {
    return Observable.create(observer => {
      this.http
          .post<Score>(environment.apiEndpoint + '/rooms/' + room.id + '/score',
                       score, jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                room.scores.push(data);
                observer.next(data);
                observer.complete();
                this.roomsUpdated.emit(this.rooms);
              },
              err => { observer.error(err); });
    });
  }

  updateScore(room: Room, score: Score): Observable<Score> {
    return Observable.create(observer => {
      this.http
          .post<Score>(environment.apiEndpoint + '/rooms/' + room.id +
                           '/scores/' + score.id,
                       score, jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                observer.next(data);
                this.roomsUpdated.emit(this.rooms);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  deleteScoreFromRoom(room: Room, score: Score): Observable<{}> {
    return Observable.create(observer => {
      this.http
          .delete(environment.apiEndpoint + '/rooms/' + room.id + '/scores/' +
                      score.id,
                  jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                let index = room.scores.indexOf(score);
                room.scores.splice(index, 1);
                this.roomsUpdated.emit(this.rooms);
                observer.next(null);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }
}

export let scoresServiceProvider = {
  provide : ScoresService,
  useFactory :
      (http: HttpClient,
       navService: NavService) => { return new ScoresService(http, navService)},
  deps : [ HttpClient, NavService ]
};
