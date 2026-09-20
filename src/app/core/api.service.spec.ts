import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { APP_CONFIG } from './config';
describe('Contrato HTTP do Bttr', () => {
  let api: ApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiUrl: '/api' } },
      ],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
  });
  const credentials = { email: 'rafael@example.com', password: 'Ab1!' };
  const profile = { username: 'Rafael', email: credentials.email };
  const skill = { name: 'Angular', daily: 30 };
  const time = { skill_id: 2, minutes: 45 };
  const cases: [string, string, (service: ApiService) => Promise<unknown>, unknown?][] = [
    ['POST', '/users/sign_in', (api) => api.signIn(credentials), credentials],
    [
      'POST',
      '/users/sign_up',
      (api) => api.signUp({ ...profile, password: 'Ab1!' }),
      { ...profile, password: 'Ab1!' },
    ],
    [
      'POST',
      '/users/forgot_password',
      (api) => api.forgotPassword(credentials.email),
      { email: credentials.email },
    ],
    ['GET', '/users/profile', (api) => api.profile()],
    ['PATCH', '/users/profile', (api) => api.updateProfile(profile), profile],
    ['DELETE', '/users/profile', (api) => api.deleteProfile()],
    [
      'POST',
      '/users/redefine_password',
      (api) => api.redefinePassword({ password: 'Ab1!', new_password: 'Ab2!' }),
      { password: 'Ab1!', new_password: 'Ab2!' },
    ],
    ['GET', '/skills/skills_from_user', (api) => api.allSkills()],
    ['GET', '/skills/skills_by_page?page=2', (api) => api.skills(2)],
    ['GET', '/skills/skill_by_id/2', (api) => api.skill('2')],
    ['POST', '/skills/create_skill', (api) => api.createSkill(skill), skill],
    ['PUT', '/skills/update_skill_by_id/2', (api) => api.updateSkill('2', skill), skill],
    ['DELETE', '/skills/delete_skill_by_id/2', (api) => api.deleteSkill('2')],
    ['GET', '/times/times_by_page?page=3', (api) => api.times(3)],
    ['GET', '/times/time_by_id/4', (api) => api.time('4')],
    ['POST', '/times/create_time', (api) => api.createTime(time), time],
    ['PUT', '/times/update_time_by_id/4', (api) => api.updateTime('4', time), time],
    ['DELETE', '/times/delete_time_by_id/4', (api) => api.deleteTime('4')],
  ];
  it.each(cases.map(([method, path, call, body]) => ({ method, path, call, body })))(
    '$method $path preserva método, rota e payload',
    async ({ method, path, call, body }) => {
      const result = call(api);
      const req = http.expectOne(`/api${path}`);
      expect(req.request.method).toBe(method);
      expect(req.request.body).toEqual(body ?? null);
      req.flush({ message: 'ok' });
      await expect(result).resolves.toEqual({ message: 'ok' });
    },
  );
  it('codifica datas com fuso sem perder o sinal de mais', async () => {
    const initial = '2026-09-01T00:00:00+03:00',
      final = '2026-09-30T23:59:59.999+03:00';
    const result = api.timesByDate('2', initial, final);
    const req = http.expectOne((req) => req.url === '/api/times/times_by_date');
    expect(req.request.params.get('date_initial')).toBe(initial);
    expect(req.request.params.get('date_final')).toBe(final);
    expect(req.request.params.get('skill_id')).toBe('2');
    expect(req.request.urlWithParams).toContain('%2B03:00');
    req.flush({ times: [] });
    await expect(result).resolves.toEqual({ times: [] });
  });
});
