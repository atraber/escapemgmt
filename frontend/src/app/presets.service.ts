/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders, HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {catchError, retryWhen} from 'rxjs/operators';
import {genericRetryStrategy} from './rxjs-utils';

import {environment} from '../environments/environment';
import {DevicesService} from './devices.service';
import {Preset} from './preset';

const jsonOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json',
  })
};

@Injectable()
export class PresetsService {
  presets: Preset[] = [];

  presetsUpdated: EventEmitter<Preset[]> = new EventEmitter();

  constructor(private devicesService: DevicesService, private http: HttpClient) {
    this.http.get<Preset[]>(environment.apiEndpoint + '/presets')
      .pipe(
        retryWhen(genericRetryStrategy({
          maxRetryAttempts: 0,
          scalingDuration: 2000,
          excludedStatusCodes: [500]
        })))
      .subscribe(presets => {
        this.presets = presets;
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
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // TODO: Use the snackbar or something to deliver this in a user friendly
    // manner.
    return Observable.throw('Something bad happened; please try again later.');
  }

  activatePreset(preset: Preset): Observable<{}> {
    return Observable.create(observer => {
      this.http.post(environment.apiEndpoint + '/preset/activate/' + preset.id, preset, jsonOptions)
        .pipe(catchError(this.handleError))
        .subscribe(data => {
          for (let preset of this.presets) {
            preset.active = false;
          }
          preset.active = true;
          this.presetsUpdated.emit(this.presets)
          observer.next(data);
          observer.complete();
        }, err => {
          observer.error(err);
        });
    });
  }

  addPreset(preset: Preset): Observable<Preset> {
    return Observable.create(observer => {
      this.http.post<Preset>(environment.apiEndpoint + '/preset', preset, jsonOptions)
        .pipe(catchError(this.handleError))
        .subscribe(data => {
          this.presets.push(data);
          this.presetsUpdated.emit(this.presets)
          observer.next(data);
          observer.complete();
        }, err => {
          observer.error(err);
        });
    });
  }

  updatePreset(preset: Preset): Observable<Preset> {
    return Observable.create(observer => {
      this.http.post<Preset>(environment.apiEndpoint + '/presets/' + preset.id, preset, jsonOptions)
        .pipe(catchError(this.handleError))
        .subscribe(preset => {
          this.presetsUpdated.emit(this.presets)
          observer.next(preset);
          observer.complete();
        }, err => {
          observer.error(err);
        });
    });
  }

  deletePreset(preset: Preset): Observable<{}> {
    return Observable.create(observer => {
      this.http.delete(environment.apiEndpoint + '/presets/' + preset.id, jsonOptions)
        .pipe(catchError(this.handleError))
        .subscribe(data => {
          let index = this.presets.indexOf(preset);
          this.presets.splice(index, 1);
          this.presetsUpdated.emit(this.presets)
          observer.next(null);
          observer.complete();
        }, err => {
          observer.error(err);
        });
    });
  }
}
