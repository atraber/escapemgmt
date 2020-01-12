/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {EventEmitter, Injectable, Injector} from '@angular/core';
import {Observable} from 'rxjs';
import {catchError, retryWhen} from 'rxjs/operators';

import {environment} from '../environment';

import {Device} from './device';
import {genericRetryStrategy} from './rxjs-utils';
import {Stream} from './stream';
import {StreamView} from './streamview';

const jsonOptions = {
  headers : new HttpHeaders({
    'Content-Type' : 'application/json',
  })
};

@Injectable()
export class DevicesService {
  devices: Device[] = [];
  streams: Stream[] = [];

  devicesUpdated: EventEmitter<Device[]> = new EventEmitter();
  streamsUpdated: EventEmitter<Stream[]> = new EventEmitter();

  constructor(private http: HttpClient) {
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
      console.error(`Backend returned code ${error.status}, ` +
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

  private refresh(): void {
    console.log('refresh() called in DevicesService');
    this.http.get<Stream[]>(environment.apiEndpoint + '/streams')
        .pipe(retryWhen(genericRetryStrategy({
          maxRetryAttempts : 3,
          scalingDuration : 2000,
          excludedStatusCodes : [ 500 ]
        })))
        .subscribe(streams => {
          this.streams = streams;
          this.streamsUpdated.emit(streams)
        });

    this.http.get<Device[]>(environment.apiEndpoint + '/devices')
        .pipe(retryWhen(genericRetryStrategy({
          maxRetryAttempts : 3,
          scalingDuration : 2000,
          excludedStatusCodes : [ 500 ]
        })))
        .subscribe(devices => {
          this.devices = devices;
          this.devicesUpdated.emit(devices)
        });
  }

  addDevice(device: Device): Observable<Device> {
    return Observable.create(observer => {
      this.http
          .post<Device>(environment.apiEndpoint + '/device', device,
                        jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                this.devices.push(data);
                this.devicesUpdated.emit(this.devices);
                observer.next(data);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  updateDevice(device: Device): Observable<Device> {
    return Observable.create(observer => {
      this.http
          .post<Device>(environment.apiEndpoint + '/devices/' + device.id,
                        device, jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                this.devicesUpdated.emit(this.devices);
                observer.next(data);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  deleteDevice(device: Device): Observable<{}> {
    return Observable.create(observer => {
      this.http
          .delete(environment.apiEndpoint + '/devices/' + device.id,
                  jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                let index = this.devices.indexOf(device);
                this.devices.splice(index, 1);
                this.devicesUpdated.emit(this.devices)
                observer.next(null);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  addStream(stream: Stream): Observable<Stream> {
    return Observable.create(observer => {
      this.http
          .post<Stream>(environment.apiEndpoint + '/stream', stream,
                        jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                this.streams.push(data);
                this.streamsUpdated.emit(this.streams);
                observer.next(data);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  updateStream(stream: Stream): Observable<Stream> {
    return Observable.create(observer => {
      this.http
          .post<Stream>(environment.apiEndpoint + '/streams/' + stream.id,
                        stream, jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                this.streamsUpdated.emit(this.streams);
                observer.next(data);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  deleteStream(stream: Stream): Observable<{}> {
    return Observable.create(observer => {
      this.http
          .delete(environment.apiEndpoint + '/streams/' + stream.id,
                  jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                let index = this.streams.indexOf(stream);
                this.streams.splice(index, 1);
                this.streamsUpdated.emit(this.streams)
                observer.next(null);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  addStreamView(stream: Stream,
                streamview: StreamView): Observable<StreamView> {
    return Observable.create(observer => {
      this.http
          .post<StreamView>(environment.apiEndpoint + '/streamview/' +
                                stream.id,
                            streamview, jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                streamview.id = data.id;
                // TODO: Figure out how to add the streamview to the stream
                observer.next(data);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  updateStreamView(streamview: StreamView): Observable<StreamView> {
    return Observable.create(observer => {
      this.http
          .post<StreamView>(environment.apiEndpoint + '/streamviews/' +
                                streamview.id,
                            streamview, jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                observer.next(data);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  deleteStreamView(stream: Stream, streamview: StreamView): Observable<{}> {
    return Observable.create(observer => {
      this.http
          .delete(environment.apiEndpoint + '/streamviews/' + streamview.id,
                  jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                let index = stream.streamviews.indexOf(streamview);
                stream.streamviews.splice(index, 1);
                observer.next(null);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }
}

export let devicesServiceProvider = {
  provide : DevicesService,
  useFactory : (http: HttpClient) => { return new DevicesService(http)},
  deps : [ HttpClient ]
};
