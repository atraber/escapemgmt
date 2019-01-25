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
import { Device } from './device';
import { Stream } from './stream';

const jsonOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json',
  })
};

@Injectable()
export class DevicesService {
  devices: Device[];
  streams: Stream[];

  devicesUpdated: EventEmitter<Device[]> = new EventEmitter();
  streamsUpdated: EventEmitter<Stream[]> = new EventEmitter();

  constructor(private http: HttpClient) {
    this.devices = [];
    this.streams = [];

    this.refresh();
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

  refresh() {
    this.http.get<Stream[]>(environment.apiEndpoint + '/streams')
      .subscribe(streams => {this.streams = streams; this.streamsUpdated.emit(streams)});

    this.http.get<Device[]>(environment.apiEndpoint + '/devices')
      .subscribe(devices => {this.devices = devices; this.devicesUpdated.emit(devices)});
  }

  addDevice(device: Device): Observable<Device> {
    return this.http.post<Device>(environment.apiEndpoint + '/device', device, jsonOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateDevice(device: Device): Observable<Device> {
    this.devicesUpdated.emit(this.devices)
    return this.http.post<Device>(environment.apiEndpoint + '/devices/' + device.id, device, jsonOptions)
      .pipe(
        catchError(this.handleError)
      );
  };

  deleteDevice(device: Device): Observable<{}> {
    var index = this.devices.indexOf(device);
    this.devices.splice(index, 1);
    this.devicesUpdated.emit(this.devices)
    return this.http.delete(environment.apiEndpoint + '/devices/' + device.id, jsonOptions)
      .pipe(
        catchError(this.handleError)
      );
  };

  addStream(stream: Stream): Observable<Stream> {
    return this.http.post<Stream>(environment.apiEndpoint + '/stream', stream, jsonOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateStream(stream: Stream): Observable<Stream> {
    this.streamsUpdated.emit(this.streams)
    return this.http.post<Stream>(environment.apiEndpoint + '/streams/' + stream.id, stream, jsonOptions)
      .pipe(
        catchError(this.handleError)
      );
  };

  deleteStream(stream: Stream): Observable<{}> {
    var index = this.streams.indexOf(stream);
    this.streams.splice(index, 1);
    this.streamsUpdated.emit(this.streams)
    return this.http.delete(environment.apiEndpoint + '/streams/' + stream.id, jsonOptions)
      .pipe(
        catchError(this.handleError)
      );
  };
}
