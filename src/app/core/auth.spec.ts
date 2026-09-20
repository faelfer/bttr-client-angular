import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  provideRouter,
} from '@angular/router';
import { MessageService } from 'primeng/api';
import { APP_CONFIG } from './config';
import { authGuard, authInterceptor, guestGuard, safeReturnUrl } from './auth';
import { SESSION_KEY, SessionService } from './session.service';
describe('Sessão e autorização', () => {
  let session: SessionService;
  let http: HttpTestingController;
  let client: HttpClient;
  let router: Router;
  let navigateSpy: jest.SpiedFunction<Router['navigate']>;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        MessageService,
        { provide: APP_CONFIG, useValue: { apiUrl: '/api' } },
      ],
    });
    session = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    router = TestBed.inject(Router);
    navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });
  afterEach(() => {
    http.verify();
    localStorage.clear();
  });
  it('persiste o token e o remove ao sair', () => {
    session.set('abc');
    expect(localStorage.getItem(SESSION_KEY)).toBe('abc');
    expect(new SessionService().authenticated()).toBe(true);
    session.clear();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(session.authenticated()).toBe(false);
  });
  it('envia Token apenas para os endpoints privados da API configurada', () => {
    session.set('abc');
    for (const url of [
      '/api/skills/skills_from_user',
      '/api/users/sign_in',
      'https://example.com/data',
      '/api-other/users/profile',
    ]) {
      client.get(url).subscribe();
      const req = http.expectOne(url);
      expect(req.request.headers.get('Authorization')).toBe(
        url === '/api/skills/skills_from_user' ? 'Token abc' : null,
      );
      req.flush({});
    }
  });
  it('encerra sessão em 401 privado e redireciona uma única vez', () => {
    session.set('abc');
    client.get('/api/users/profile').subscribe({ error: () => undefined });
    http.expectOne('/api/users/profile').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.authenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledTimes(1);
  });
  it('não encerra sessão em falha de credenciais no endpoint público', () => {
    session.set('abc');
    client.post('/api/users/sign_in', {}).subscribe({ error: () => undefined });
    http.expectOne('/api/users/sign_in').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.authenticated()).toBe(true);
  });
  it('protege rotas e preserva o destino', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/times/create' } as RouterStateSnapshot),
    );
    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/?returnUrl=%2Ftimes%2Fcreate',
    );
    session.set('abc');
    expect(
      TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      ),
    ).toBe(true);
    expect(
      router.serializeUrl(
        TestBed.runInInjectionContext(() =>
          guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
        ) as ReturnType<Router['createUrlTree']>,
      ),
    ).toBe('/home');
  });
  it.each([null, '//evil.example', 'https://evil.example', '/\\evil.example', '/sign-up'])(
    'rejeita destino de retorno externo ou público: %s',
    (value) => {
      expect(safeReturnUrl(value)).toBe('/home');
    },
  );
});
