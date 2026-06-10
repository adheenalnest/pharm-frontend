import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Auth endpoints send real emails via SMTP — allow up to 30 s.
// All other API calls (data loading) fail after 12 s.
const AUTH_TIMEOUT_MS = 30_000;
const DEFAULT_TIMEOUT_MS = 8_000;

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  const isAuth = req.url.includes('/auth/');
  const ms = isAuth ? AUTH_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;

  return next(req).pipe(
    timeout(ms),
    catchError(err => {
      if (err?.name === 'TimeoutError') {
        const message = isAuth
          ? 'OTP request timed out. The server may be slow — please try again in a moment.'
          : 'Server is not responding. Please make sure the backend is running and try again.';
        return throwError(() => new HttpErrorResponse({
          error: { message },
          status: 0,
          statusText: 'Timeout',
        }));
      }
      return throwError(() => err);
    })
  );
};
