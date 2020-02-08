/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import moment from 'moment';
import {Observable} from 'rxjs';
import {timer} from 'rxjs';
import {catchError, retryWhen} from 'rxjs/operators';

import {environment} from '../../environment';
import {Room} from '../room';
import {saneRetryStrategy} from '../rxjs-utils';

const jsonOptions = {
  headers : new HttpHeaders({
    'Content-Type' : 'application/json',
  })
};

@Injectable({providedIn : 'root'})
export class RoomsService {
  rooms: Room[] = [];
  roomsUpdated: EventEmitter<Room[]> = new EventEmitter();
  interval: number = 15; // Seconds.

  constructor(private http: HttpClient) {
    this.updateRooms();
    let t = timer(0, this.interval * 1000);
    t.subscribe(t => { this.updateRooms(); });
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
    // We do not display a message here when we cannot refresh. This is because
    // this is shown on "the big screen" and thus this message is less
    // interesting to clients.
    this.http.get<Room[]>(environment.apiEndpoint + '/rooms')
        .pipe(retryWhen(saneRetryStrategy()))
        .subscribe(rooms => {
          this.rooms = this.sortRooms(rooms);
          this.roomsUpdated.emit(rooms);
        });
  }
}