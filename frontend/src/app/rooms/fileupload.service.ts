/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {catchError, retryWhen} from 'rxjs/operators';

import {environment} from '../../environment';
import {NavService} from '../nav.service';
import {genericRetryStrategy} from '../rxjs-utils';

import {FileBuffer} from './filebuffer';

@Injectable({providedIn : 'root'})
export class FileUploadService {

  constructor(private http: HttpClient, private navService: NavService) {}

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

  upload(file: File): Observable<string> {
    return Observable.create(observer => {
      const formData: FormData = new FormData();
      formData.append('file', file);
      this.http
          .post<FormData>(environment.apiEndpoint + '/file/upload', formData,
                          {})
          .pipe(catchError(this.handleError))
          .subscribe(
              data => {
                observer.next(data);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }
}
