/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {EventEmitter, Injectable, Injector} from '@angular/core';
import {Observable} from 'rxjs';
import {catchError, retryWhen} from 'rxjs/operators';

import {environment} from '../environment';

import {Device, DeviceStream} from './device';
import {NavService} from './nav.service';
import {Preset} from './preset';
import {saneRetryStrategy} from './rxjs-utils';
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
  loaded = false;
  devicesLoaded = false;
  streamsLoaded = false;

  devicesUpdated: EventEmitter<Device[]> = new EventEmitter();
  streamsUpdated: EventEmitter<Stream[]> = new EventEmitter();

  constructor(private http: HttpClient, private navService: NavService) {
    this.refresh();
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
    this.navService.message(
        'Failed to communicate with backend. Please try again later.');
    return Observable.throw('Something bad happened; please try again later.');
  }

  private refresh(): void {
    console.log('refresh() called in DevicesService');
    this.http.get<Stream[]>(environment.apiEndpoint + '/streams')
        .pipe(retryWhen(saneRetryStrategy(
            (msg: string): void => { this.navService.message(msg); })))
        .pipe(catchError(this.handleError))
        .subscribe(streams => {
          this.streams = streams;
          this.streamsLoaded = true;
          this.loaded = this.devicesLoaded && this.streamsLoaded;
          this.streamsUpdated.emit(streams)
        });

    this.http.get<Device[]>(environment.apiEndpoint + '/devices')
        .pipe(retryWhen(saneRetryStrategy(
            (msg: string): void => { this.navService.message(msg); })))
        .pipe(catchError(this.handleError))
        .subscribe(devices => {
          this.devices = devices;
          this.devicesLoaded = true;
          this.loaded = this.devicesLoaded && this.streamsLoaded;
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

  addStreamToDevicePreset(device: Device, preset: Preset,
                          stream: Stream): boolean {
    let ds = device.device_streams.find(ds => {
      return ds.stream_id == stream.id && ds.preset_id == preset.id;
    });
    if (ds != undefined) {
      console.log('DeviceStream already present: cannot add stream');
      return false;
    }

    let newds = new DeviceStream();
    newds.device_id = device.id;
    newds.preset_id = preset.id;
    newds.stream_id = stream.id;

    device.device_streams.push(newds);

    this.devicesUpdated.emit(this.devices);

    return true;
  }

  removeStreamFromDevicePreset(device: Device, preset: Preset,
                               stream: Stream): boolean {
    let ds = device.device_streams.find(ds => {
      return ds.stream_id == stream.id && ds.preset_id == preset.id;
    });
    if (ds == undefined) {
      console.log('DeviceStream not found: cannot delete stream');
      return false;
    }

    let index = device.device_streams.indexOf(ds);
    if (index < 0) {
      console.log('Stream not found: Cannot delete stream');
      return false;
    }
    device.device_streams.splice(index, 1);

    this.devicesUpdated.emit(this.devices);

    return true;
  }

  getStreamById(id: number): Stream|null {
    // TODO: Use an index. This is very inefficient.
    for (let stream of this.streams) {
      if (stream.id == id)
        return stream;
    }
    return null;
  }

  getDeviceStreamsByPreset(device: Device, preset: Preset): Stream[] {
    let streams: Stream[] = [];
    for (let ds of device.device_streams) {
      if (ds.preset_id == preset.id) {
        let stream = this.getStreamById(ds.stream_id);
        if (stream == null) {
          console.log('Stream with id ' + ds.stream_id + ' not found');
          continue;
        }
        streams.push(stream);
      }
    }
    return streams;
  }
}

export let devicesServiceProvider = {
  provide : DevicesService,
  useFactory : (
      http: HttpClient,
      navService: NavService) => { return new DevicesService(http, navService)},
  deps : [ HttpClient, NavService ]
};
