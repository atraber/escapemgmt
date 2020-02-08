import {Observable, throwError, timer} from 'rxjs';
import {finalize, mergeMap} from 'rxjs/operators';

export const genericRetryStrategy = ({
  maxRetryAttempts = 3,
  scalingDuration = 1000,
  maxBackoff = 10000,
  excludedStatusCodes = [],
  messageFn = null
}: {
  maxRetryAttempts?: number,
  scalingDuration?: number,
  maxBackoff?: number,
  excludedStatusCodes?: number[],
  messageFn?: (msg: string) => void
} = {}) => (attempts: Observable<any>) => {
  return attempts.pipe(mergeMap((error, i) => {
    const retryAttempt = i + 1;
    // if maximum number of retries have been met
    // or response is a status code we don't wish to retry, throw error
    if ((maxRetryAttempts > 0 && retryAttempt > maxRetryAttempts) ||
        excludedStatusCodes.find(e => e === error.status)) {
      messageFn('Maximum number of retries have been met. Giving up.');
      return throwError(error);
    }
    let backoff = retryAttempt * scalingDuration;
    if (backoff > maxBackoff)
      backoff = maxBackoff;
    if (messageFn) {
      messageFn(`Attempt ${retryAttempt}: retrying in ${backoff}ms`);
    }
    console.log(`Attempt ${retryAttempt}: retrying in ${backoff}ms`);
    // retry after 1s, 2s, etc...
    return timer(backoff);
  }));
};

export const saneRetryStrategy = (messageFn?: (msg: string) => void) => {
  return genericRetryStrategy({
    maxRetryAttempts : 0,
    scalingDuration : 1000,
    maxBackoff : 5000,
    excludedStatusCodes : [ 500 ],
    messageFn : messageFn
  });
};
