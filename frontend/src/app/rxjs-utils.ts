import {Observable, throwError, timer} from 'rxjs';
import {finalize, mergeMap} from 'rxjs/operators';

export const genericRetryStrategy = ({
  maxRetryAttempts = 3,
  scalingDuration = 1000,
  excludedStatusCodes = [],
  messageFn = null
}: {
  maxRetryAttempts?: number,
  scalingDuration?: number,
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
    if (messageFn) {
      messageFn(`Attempt ${retryAttempt}: retrying in ${
          retryAttempt * scalingDuration}ms`);
    }
    console.log(`Attempt ${retryAttempt}: retrying in ${
        retryAttempt * scalingDuration}ms`);
    // retry after 1s, 2s, etc...
    return timer(retryAttempt * scalingDuration);
  }));
};
