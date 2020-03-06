import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {catchError, retryWhen} from 'rxjs/operators';

import {environment} from '../environment';

import {NavService} from './nav.service';
import {genericRetryStrategy} from './rxjs-utils';
import {Stream} from './stream';
import {StreamView} from './streamview';

class StreamInfo {
  Width: number;
  Height: number;
}

@Injectable()
export class StreamUtils {
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

  streamPreviewUrl(stream: Stream, maxWidth = null, maxHeight = null): string {
    // TODO: Be smarter about this.
    if (stream.streamviews.length > 0) {
      return this.streamViewPreviewUrl(stream.streamviews[0], maxWidth,
                                       maxHeight);
    } else {
      return "";
    }
  }

  streamViewPreviewUrl(streamview: StreamView, maxWidth = null,
                       maxHeight = null): string {
    let width = streamview.crop_x2 - streamview.crop_x1;
    let height = streamview.crop_y2 - streamview.crop_y1;
    let outWidth = width;
    let outHeight = height;
    if (maxWidth && maxHeight && (width > maxWidth || height > maxHeight)) {
      let ratio = Math.max(width / maxWidth, height / maxHeight);
      outWidth = Math.floor(width / ratio);
      outHeight = Math.floor(height / ratio);
    }

    let url = environment.viewEndpoint +
              '/stream?url=' + encodeURIComponent(streamview.url) +
              '&x=' + streamview.crop_x1 + '&y=' + streamview.crop_y1 +
              '&width=' + width + '&height=' + height +
              '&out_width=' + outWidth + '&out_height=' + outHeight;
    return url;
  }

  streamViewInfo(streamview: StreamView): Observable<[ number, number ]> {
    let url = environment.viewEndpoint +
              '/info?url=' + encodeURIComponent(streamview.url);
    return Observable.create(observer => {
      this.http.get<StreamInfo>(url)
          .pipe(retryWhen(genericRetryStrategy({
            maxRetryAttempts : 3,
            scalingDuration : 1000,
            maxBackoff : 5000,
            excludedStatusCodes : [],
            messageFn : msg => { this.navService.message(msg); }
          })))
          .subscribe(
              si => {
                observer.next([ si.Width, si.Height ]);
                observer.complete();
              },
              err => { observer.error(err); });
    });
  }
}

export let streamUtilsProvider = {
  provide : StreamUtils,
  useFactory :
      (http: HttpClient,
       navService: NavService) => { return new StreamUtils(http, navService)},
  deps : [ HttpClient, NavService ]
};
