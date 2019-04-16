/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Device } from './device';
import { Stream } from './stream';
import { StreamView } from './streamview';

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
    this.listenForChanges();
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

  private listenForChanges() {
    let source = new EventSource(environment.apiEndpoint + '/subscribe');
    source.addEventListener('devicesChanged', message => {
      console.log('devicesChanged event received from server');
      this.refresh();
    });
  }

  private refresh() {
    console.log('refresh() called in DevicesService');
    this.http.get<Stream[]>(environment.apiEndpoint + '/streams')
      .subscribe(streams => {this.streams = streams; this.streamsUpdated.emit(streams)});

    this.http.get<Device[]>(environment.apiEndpoint + '/devices')
      .subscribe(devices => {this.devices = devices; this.devicesUpdated.emit(devices)});
  }

  addDevice(device: Device): Observable<Device> {
    return this.http.post<Device>(environment.apiEndpoint + '/device', device, jsonOptions)
      .pipe(catchError(this.handleError));
  }

  updateDevice(device: Device): Observable<Device> {
    this.devicesUpdated.emit(this.devices)
    return this.http.post<Device>(environment.apiEndpoint + '/devices/' + device.id, device, jsonOptions)
      .pipe(catchError(this.handleError));
  }

  deleteDevice(device: Device): Observable<{}> {
    // TODO: The removal from our current list should only be done after the
    // delete succeeded.
    let id = device.id;
    var index = this.devices.indexOf(device);
    this.devices.splice(index, 1);
    this.devicesUpdated.emit(this.devices)
    return this.http.delete(environment.apiEndpoint + '/devices/' + id, jsonOptions)
      .pipe(catchError(this.handleError));
  }

  addStream(stream: Stream): Observable<Stream> {
    return this.http.post<Stream>(environment.apiEndpoint + '/stream', stream, jsonOptions)
      .pipe(catchError(this.handleError));
  }

  updateStream(stream: Stream): Observable<Stream> {
    this.streamsUpdated.emit(this.streams)
    return this.http.post<Stream>(environment.apiEndpoint + '/streams/' + stream.id, stream, jsonOptions)
      .pipe(catchError(this.handleError));
  }

  deleteStream(stream: Stream): Observable<{}> {
    var index = this.streams.indexOf(stream);
    this.streams.splice(index, 1);
    this.streamsUpdated.emit(this.streams)
    return this.http.delete(environment.apiEndpoint + '/streams/' + stream.id, jsonOptions)
      .pipe(catchError(this.handleError));
  }

  addStreamView(streamview: StreamView, stream_id): Observable<StreamView> {
    return this.http.post<StreamView>(environment.apiEndpoint + '/streamview/' + stream_id, streamview, jsonOptions)
      .pipe(catchError(this.handleError));
  }

  updateStreamView(streamview: StreamView): Observable<StreamView> {
    return this.http.post<StreamView>(environment.apiEndpoint + '/streamviews/' + streamview.id, streamview, jsonOptions)
      .pipe(catchError(this.handleError));
  }

  deleteStreamView(stream: Stream, streamview: StreamView): Observable<{}> {
    let index = stream.streamviews.indexOf(streamview);
    stream.streamviews.splice(index, 1);
    return this.http.delete(environment.apiEndpoint + '/streamviews/' + streamview.id, jsonOptions)
      .pipe(catchError(this.handleError));
  }
}
