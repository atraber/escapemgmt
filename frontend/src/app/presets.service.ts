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
import {PresetGroup} from './preset-group';
import {saneRetryStrategy} from './rxjs-utils';

const jsonOptions = {
  headers : new HttpHeaders({
    'Content-Type' : 'application/json',
  })
};

@Injectable()
export class PresetsService {
  presets: Preset[] = [];
  presetGroups: PresetGroup[] = [];
  loaded = false;

  private loadedPresets = false;
  private loadedPresetGroups = false;

  presetsUpdated: EventEmitter<Preset[]> = new EventEmitter();
  presetGroupsUpdated: EventEmitter<PresetGroup[]> = new EventEmitter();

  constructor(private devicesService: DevicesService, private http: HttpClient,
              private navService: NavService) {
    this.http.get<Preset[]>(environment.apiEndpoint + '/presets')
        .pipe(retryWhen(saneRetryStrategy(
            (msg: string): void => { this.navService.message(msg); })))
        .pipe(catchError(this.handleError))
        .subscribe(presets => {
          this.presets = presets;
          this.loadedPresets = true;
          this.updateElements();
        });

    this.http.get<PresetGroup[]>(environment.apiEndpoint + '/presetgroups')
        .pipe(retryWhen(saneRetryStrategy(
            (msg: string): void => { this.navService.message(msg); })))
        .pipe(catchError(this.handleError))
        .subscribe(presetGroups => {
          this.presetGroups = presetGroups;
          this.loadedPresetGroups = true;
          this.updateElements();
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
                this.updateElements();
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
                this.updateElements();
                observer.next(null);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  addPresetGroup(pg: PresetGroup): Observable<PresetGroup> {
    return Observable.create(observer => {
      this.http
          .post<PresetGroup>(environment.apiEndpoint + '/presetgroup', pg,
                             jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                this.presetGroups.push(data);
                this.presetGroupsUpdated.emit(this.presetGroups)
                observer.next(data);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  updatePresetGroup(pg: PresetGroup): Observable<PresetGroup> {
    return Observable.create(observer => {
      this.http
          .post<PresetGroup>(environment.apiEndpoint + '/presetgroups/' + pg.id,
                             pg, jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                this.presetGroupsUpdated.emit(this.presetGroups)
                observer.next(data);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  deletePresetGroup(pg: PresetGroup): Observable<{}> {
    return Observable.create(observer => {
      this.http
          .delete(environment.apiEndpoint + '/presetgroups/' + pg.id,
                  jsonOptions)
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                let index = this.presetGroups.indexOf(pg);
                this.presetGroups.splice(index, 1);
                this.presetGroupsUpdated.emit(this.presetGroups)
                observer.next(null);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }

  private updateElements() {
    this.loaded = this.loadedPresets && this.loadedPresetGroups;
    if (this.loaded) {
      this.updatePresetsInPresetGroups();
    }
    // Need to update both to propagate loaded status.
    this.presetGroupsUpdated.emit(this.presetGroups);
    this.presetsUpdated.emit(this.presets);
  }

  private updatePresetsInPresetGroups() {
    // First we build an index of preset groups.
    let pgIndex: {[id: number]: PresetGroup} = [];
    for (let pg of this.presetGroups) {
      pgIndex[pg.id] = pg;
      pg.presets = [];
    }

    for (let p of this.presets) {
      let pg = pgIndex[p.preset_group_id];
      if (pg == null) {
        console.log('Did not find preset group with id ' + p.preset_group_id);
        continue;
      }
      pg.presets.push(p);
      p.presetGroup = pg;
    }
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
