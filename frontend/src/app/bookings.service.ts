/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {catchError, retryWhen} from 'rxjs/operators';

import {environment} from '../environment';

import {Booking} from './booking';
import {Room} from './room';
import {genericRetryStrategy} from './rxjs-utils';
import {ScoresService} from './scores.service';

const jsonOptions = {
  headers : new HttpHeaders({
    'Content-Type' : 'application/json',
  })
};

//@Injectable({providedIn : 'root', deps : [ ScoresService, HttpClient ]})
@Injectable()
export class BookingsService {
  rooms: Room[] = [];
  bookings: Booking[] = [];

  bookingsUpdated: EventEmitter<Booking[]> = new EventEmitter();

  constructor(private http: HttpClient, private scoresService: ScoresService) {
    this.rooms = this.scoresService.rooms;

    this.scoresService.roomsUpdated.subscribe((rooms) => this.rooms = rooms);

    this.http.get<Booking[]>(environment.apiEndpoint + '/bookings')
        .pipe(retryWhen(genericRetryStrategy({
          maxRetryAttempts : 0,
          scalingDuration : 2000,
          excludedStatusCodes : [ 500 ]
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
      console.error(`Backend returned code ${error.status}, ` +
                    `body was: ${error.error}`);
    }
    // TODO: Use the snackbar or something to deliver this in a user friendly
    // manner.
    return throwError('Something bad happened; please try again later.');
  }
}

export let bookingsServiceProvider = {
  provide : BookingsService,
  useFactory :
      (http: HttpClient,
       scoresService:
           ScoresService) => { return new BookingsService(http, scoresService)},
  deps : [ HttpClient, ScoresService ]
};
