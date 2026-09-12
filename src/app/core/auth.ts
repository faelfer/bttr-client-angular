import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { SessionService } from './session.service';
import { APP_CONFIG } from './config';
export const authGuard: CanActivateFn = (_, state) =>
  inject(SessionService).authenticated() ||
  inject(Router).createUrlTree(['/'], { queryParams: { returnUrl: state.url } });
export const guestGuard: CanActivateFn = () =>
  !inject(SessionService).authenticated() || inject(Router).createUrlTree(['/home']);
export function safeReturnUrl(value: string | null): string {
  return value && /^\/(home|profile|redefine-password|skills|times)([/?]|$)/.test(value)
    ? value
    : '/home';
}
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const messages = inject(MessageService);
  const base = inject(APP_CONFIG).apiUrl;
  const isApi = request.url.startsWith(`${base}/`);
  const isPublic = /\/users\/(sign_in|sign_up|forgot_password)$/.test(request.url);
  const token = session.token();
  const authenticated = isApi && !isPublic && !!token;
  const outgoing = authenticated
    ? request.clone({ setHeaders: { Authorization: `Token ${token}` } })
    : request;
  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        authenticated &&
        session.token() === token
      ) {
        session.clear();
        messages.add({
          severity: 'warn',
          summary: 'Sessão encerrada',
          detail: 'Entre novamente para continuar.',
        });
        void router.navigate(['/'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
