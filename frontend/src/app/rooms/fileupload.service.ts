/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders, HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {catchError, retryWhen} from 'rxjs/operators';
import {genericRetryStrategy} from '../rxjs-utils';

import {environment} from '../../environments/environment';
import {FileBuffer} from './filebuffer';

@Injectable()
export class FileUploadService {

  constructor(private http: HttpClient) {
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


  upload(file: File): Observable<number> {
    return Observable.create(observer => {
      const formData: FormData = new FormData();
      formData.append('file', file);
      this.http.post<FormData>(environment.apiEndpoint + '/file/upload', formData, {})
        .pipe(catchError(this.handleError))
        .subscribe(data => {
          observer.next(data);
          observer.complete();
        }, err => {
          observer.error(err);
        });
    });
  }
}
