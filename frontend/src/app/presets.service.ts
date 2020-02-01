/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {catchError, retryWhen} from 'rxjs/operators';

import {environment} from '../environment';

import {DevicesService} from './devices.service';
import {NavService} from './nav.service';
import {Preset} from './preset';
import {genericRetryStrategy} from './rxjs-utils';

const jsonOptions = {
  headers : new HttpHeaders({
    'Content-Type' : 'application/json',
  })
};

@Injectable()
export class PresetsService {
  presets: Preset[] = [];
  loaded = false;

  presetsUpdated: EventEmitter<Preset[]> = new EventEmitter();

  constructor(private devicesService: DevicesService, private http: HttpClient,
              private navService: NavService) {
    this.http.get<Preset[]>(environment.apiEndpoint + '/presets')
        .pipe(retryWhen(genericRetryStrategy({
          maxRetryAttempts : 0,
          scalingDuration : 2000,
          excludedStatusCodes : [ 500 ]
        })))
        .pipe(catchError(this.handleError))
        .subscribe(presets => {
          this.presets = presets;
          this.loaded = true;
          this.presetsUpdated.emit(presets);
        });
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

  activatePreset(preset: Preset): Observable<{}> {
    return Observable.create(observer => {
      this.http
          .post(environment.apiEndpoint + '/preset/activate/' + preset.id,
                preset, jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                for (let preset of this.presets) {
                  preset.active = false;
                }
                preset.active = true;
                this.presetsUpdated.emit(this.presets)
                observer.next(data);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  addPreset(preset: Preset): Observable<Preset> {
    return Observable.create(observer => {
      this.http
          .post<Preset>(environment.apiEndpoint + '/preset', preset,
                        jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                this.presets.push(data);
                this.presetsUpdated.emit(this.presets)
                observer.next(data);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  updatePreset(preset: Preset): Observable<Preset> {
    return Observable.create(observer => {
      this.http
          .post<Preset>(environment.apiEndpoint + '/presets/' + preset.id,
                        preset, jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              preset => {
                this.presetsUpdated.emit(this.presets)
                observer.next(preset);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  deletePreset(preset: Preset): Observable<{}> {
    return Observable.create(observer => {
      this.http
          .delete(environment.apiEndpoint + '/presets/' + preset.id,
                  jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                let index = this.presets.indexOf(preset);
                this.presets.splice(index, 1);
                this.presetsUpdated.emit(this.presets)
                observer.next(null);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }
}

export let presetsServiceProvider = {
  provide : PresetsService,
  useFactory :
      (ds: DevicesService, http: HttpClient,
       navService:
           NavService) => { return new PresetsService(ds, http, navService)},
  deps : [ DevicesService, HttpClient, NavService ]
};
