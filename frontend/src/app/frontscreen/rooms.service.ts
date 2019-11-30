/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {catchError, retryWhen} from 'rxjs/operators';
import {genericRetryStrategy} from '../rxjs-utils';
import {timer} from 'rxjs';
import {environment} from '../../environments/environment';

import * as moment from 'moment';
import {Room} from '../room';

const jsonOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  })
};

@Injectable()
export class RoomsService {
  rooms: Room[] = [];
  roomsUpdated: EventEmitter<Room[]> = new EventEmitter();

  constructor(private http: HttpClient) {
    this.updateRooms();
    let t = timer(0, 15 * 1000);
    t.subscribe(t => {
      this.updateRooms();
    });
  }

  private sortRooms(rooms: Room[]): Room[] {
    for (let room of rooms) {
      room.scores.sort((s1, s2) => {
        var m1 = moment.utc(s1.time * 1000);
        var m2 = moment.utc(s2.time * 1000);
        var t1 = (m1.hours() * 60 + m1.minutes()) * 60 * 1000;
        var t2 = (m2.hours() * 60 + m2.minutes()) * 60 * 1000;
        if (t1 > t2)
          return 1;
        else if (t1 < t2)
          return -1;
        return 0;
      });
    }

    return rooms;
  }

  private updateRooms(): void {
    this.http.get<Room[]>(environment.apiEndpoint + '/rooms')
      .pipe(
        retryWhen(genericRetryStrategy({
          maxRetryAttempts: 3,
          scalingDuration: 2000,
          excludedStatusCodes: [500]
        })))
      .subscribe(rooms => {
        this.rooms = this.sortRooms(rooms);
        this.roomsUpdated.emit(rooms)
      });
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
    // TODO: Use the snackbar or something to deliver this in a user friendly
    // manner.
    return Observable.throw('Something bad happened; please try again later.');
  }
}