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
import {PresetGroup} from './preset-group';
import {PresetsService} from './presets.service';
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

  constructor(private presetsService: PresetsService, private http: HttpClient,
              private navService: NavService) {
    this.presetsService.presetGroupsUpdated.subscribe(
        _ => { this.updateDevicePresetGroups(); });
    this.refresh();
  }

  private updateDevicePresetGroups() {
    let pgIndex = {};
    for (let pg of this.presetsService.presetGroups) {
      pgIndex[pg.id] = pg;
    }

    for (let device of this.devices) {
      device.presetGroup = pgIndex[device.preset_group_id];
    }
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(`Backend returned code ${error.status}, ` +
                    `body was: ${error.error}, ` +
                    `error: ${error}`);
    }
    this.navService.message(
        'Failed to communicate with backend. Please try again later.');
    return Observable.throw('Something bad happened; please try again later.');
  }

  private updatedEmit() {
    this.loaded =
        this.devicesLoaded && this.streamsLoaded && this.presetsService.loaded;
    // TODO: We need to emit both here anyways. Let's just use one in the
    // future since this makes no sense this way.
    this.streamsUpdated.emit(this.streams);
    this.devicesUpdated.emit(this.devices);
  }

  private streamsUpdatedEmit() { this.updatedEmit(); }

  private refresh(): void {
    console.log('refresh() called in DevicesService');
    this.http.get<Stream[]>(environment.apiEndpoint + '/streams')
        .pipe(retryWhen(saneRetryStrategy(
            (msg: string): void => { this.navService.message(msg); })))
        .pipe(catchError(this.handleError))
        .subscribe(streams => {
          this.streams = streams;
          this.streamsLoaded = true;
          this.streamsUpdatedEmit();
        });

    this.http.get<Device[]>(environment.apiEndpoint + '/devices')
        .pipe(retryWhen(saneRetryStrategy(
            (msg: string): void => { this.navService.message(msg); })))
        .pipe(catchError(this.handleError))
        .subscribe(devices => {
          this.devices = devices;
          this.updateDevicePresetGroups();
          this.devicesLoaded = true;
          this.updatedEmit();
        });
  }

  addDevice(device: Device): Observable<Device> {
    return Observable.create(observer => {
      this.http
          .post<Device>(environment.apiEndpoint + '/device',
                        Device.toJSON(device), jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                this.devices.push(data);
                this.updatedEmit();
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
                        Device.toJSON(device), jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                this.updatedEmit();
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
                this.updatedEmit();
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
                this.streamsUpdatedEmit();
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
                this.streamsUpdatedEmit();
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
                this.streamsUpdatedEmit();
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

    this.updatedEmit();

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

    this.updatedEmit();

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
  useFactory : (presetsService: PresetsService, http: HttpClient,
                navService: NavService) => {
    return new DevicesService(presetsService, http, navService)
  },
  deps : [ PresetsService, HttpClient, NavService ]
};
