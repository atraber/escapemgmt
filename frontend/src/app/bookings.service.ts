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
import {NavService} from './nav.service';
import {Room} from './room';
import {saneRetryStrategy} from './rxjs-utils';

const jsonOptions = {
  headers : new HttpHeaders({
    'Content-Type' : 'application/json',
  })
};

// TODO(atraber): Frankly I don't understand Injectable...
//@Injectable()
export class BookingsService {
  bookings: Booking[] = [];

  loaded = false;
  bookingsUpdated: EventEmitter<Booking[]> = new EventEmitter();

  constructor(private http: HttpClient, private navService: NavService) {

    this.http.get<Booking[]>(environment.apiEndpoint + '/bookings')
        .pipe(retryWhen(saneRetryStrategy(
            (msg: string): void => { this.navService.message(msg); })))
        .pipe(catchError(this.handleError))
        .subscribe(bookings => {
          this.bookings = bookings;
          this.loaded = true;
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
    this.navService.message(
        'Failed to retrieve booking data. Please try again later.');
    return throwError('Something bad happened; please try again later.');
  }

  addBooking(booking: Booking): Observable<Booking> {
    return Observable.create(observer => {
      this.http
          .post<Booking>(environment.apiEndpoint + '/booking', booking,
                         jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                this.bookings.push(data);
                this.bookingsUpdated.emit(this.bookings);
                observer.next(data);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }
}

export let bookingsServiceProvider = {
  provide : BookingsService,
  useFactory :
      (http: HttpClient,
       navService:
           NavService) => { return new BookingsService(http, navService)},
  deps : [ HttpClient, NavService ]
};
