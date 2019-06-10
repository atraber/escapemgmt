/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, retryWhen} from 'rxjs/operators';
import {genericRetryStrategy} from './rxjs-utils';

import {environment} from '../environments/environment';
import {ScoresService} from './scores.service';
import {Booking} from './booking';
import {Room} from './room';

const jsonOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json',
  })
};

@Injectable()
export class BookingsService {
  rooms: Room[] = [];
  bookings: Booking[] = [];

  bookingsUpdated: EventEmitter<Booking[]> = new EventEmitter();

  constructor(
      private http: HttpClient,
      private scoresService: ScoresService) {
    this.rooms = this.scoresService.rooms;

    this.scoresService.roomsUpdated.subscribe(
      (rooms) => this.rooms = rooms
    );

    this.http.get<Booking[]>(environment.apiEndpoint + '/bookings')
      .pipe(
        retryWhen(genericRetryStrategy({
          maxRetryAttempts: 0,
          scalingDuration: 2000,
          excludedStatusCodes: [500]
        })))
      .pipe(catchError(this.handleError))
      .subscribe(bookings => {
        this.bookings = bookings;
        this.bookingsUpdated.emit(bookings);
      });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
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
    return throwError('Something bad happened; please try again later.');
  }
}
