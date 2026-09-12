import { expect, Page } from '@playwright/test';
import { Skill, TimeEntry } from '../src/app/core/models';
export async function mockApi(
  page: Page,
  options: { authenticated?: boolean; empty?: boolean } = {},
) {
  const created = '2026-09-12T12:30:00.000Z';
  const state = {
    user: { id: 1, username: 'Rafael', email: 'rafael@example.com', created },
    skills: (options.empty
      ? []
      : ['Inglês', 'Programação', 'Violão', 'Desenho', 'Leitura', 'Fotografia'].map(
          (name, index) => ({ id: index + 1, name, daily: 30, created }),
        )) as Skill[],
    times: [] as TimeEntry[],
    requests: [] as {
      method: string;
      path: string;
      body: Record<string, unknown> | null;
      query: URLSearchParams;
    }[],
    failNext: '' as string,
    unauthorized: false,
  };
  if (!options.empty)
    state.times = Array.from({ length: 6 }, (_, index) => ({
      id: index + 1,
      skill: state.skills[index],
      minutes: 25 + index,
      created,
    }));
  await page.addInitScript((authenticated) => {
    if (authenticated && !sessionStorage.getItem('bttr-test-initialized')) {
      localStorage.setItem('bttr.token', 'test-token');
      sessionStorage.setItem('bttr-test-initialized', 'true');
    }
  }, options.authenticated ?? false);
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api', '');
    const method = request.method();
    const body = request.postDataJSON();
    state.requests.push({ method, path, body, query: url.searchParams });
    const respond = (json: unknown, status = 200) => route.fulfill({ status, json });
    if (state.failNext === path) {
      state.failNext = '';
      await respond({ message: 'Servidor indisponível. Tente novamente.' }, 503);
      return;
    }
    const isPublic = ['/users/sign_in', '/users/sign_up', '/users/forgot_password'].includes(path);
    if (!isPublic) {
      expect(request.headers()['authorization']).toBe('Token test-token');
      if (state.unauthorized) {
        await respond({ message: 'Sessão expirada.' }, 401);
        return;
      }
    }
    if (path === '/users/sign_in') {
      await respond({ token: 'test-token', user: state.user, message: 'Bem-vindo' });
      return;
    }
    if (path === '/users/profile') {
      if (method === 'GET') await respond({ user: state.user });
      else {
        if (method === 'PATCH') Object.assign(state.user, body);
        await respond({ message: 'Conta atualizada com sucesso.' });
      }
      return;
    }
    if (path.startsWith('/users/')) {
      await respond({ message: 'Solicitação realizada com sucesso.' });
      return;
    }
    if (path.endsWith('_by_page')) {
      const items = path.startsWith('/skills') ? state.skills : state.times;
      const pageNumber = Number(url.searchParams.get('page'));
      expect(pageNumber).toBeGreaterThanOrEqual(1);
      await respond({
        count: items.length,
        next: null,
        previous: null,
        results: items.slice((pageNumber - 1) * 5, pageNumber * 5),
      });
      return;
    }
    if (path === '/skills/skills_from_user') {
      await respond({ skills: state.skills });
      return;
    }
    if (path === '/times/times_by_date') {
      await respond({
        times: state.times.filter(
          (time) => time.skill.id === Number(url.searchParams.get('skill_id')),
        ),
      });
      return;
    }
    const id = Number(path.split('/').pop());
    if (path.startsWith('/skills/skill_by_id/')) {
      const skill = state.skills.find((item) => item.id === id);
      await respond(
        skill ? { skill } : { message: 'Habilidade não encontrada.' },
        skill ? 200 : 404,
      );
      return;
    }
    if (path.startsWith('/times/time_by_id/')) {
      const time = state.times.find((item) => item.id === id);
      await respond(time ? { time } : { message: 'Tempo não encontrado.' }, time ? 200 : 404);
      return;
    }
    if (path === '/skills/create_skill') state.skills.unshift({ id: 99, created, ...body });
    else if (path.startsWith('/skills/update_skill_by_id/'))
      Object.assign(
        state.skills.find((item) => item.id === id)!,
        body,
      );
    else if (path.startsWith('/skills/delete_skill_by_id/')) {
      state.skills = state.skills.filter((item) => item.id !== id);
      state.times = state.times.filter((time) => time.skill.id !== id);
    } else if (path === '/times/create_time')
      state.times.unshift({
        id: 99,
        created,
        minutes: body.minutes,
        skill: state.skills.find((item) => item.id === body.skill_id)!,
      });
    else if (path.startsWith('/times/update_time_by_id/'))
      Object.assign(
        state.times.find((item) => item.id === id)!,
        { minutes: body.minutes, skill: state.skills.find((item) => item.id === body.skill_id)! },
      );
    else if (path.startsWith('/times/delete_time_by_id/'))
      state.times = state.times.filter((item) => item.id !== id);
    else {
      await respond({ message: `Endpoint não simulado: ${method} ${path}` }, 500);
      return;
    }
    await respond({ message: 'Alteração realizada com sucesso.' });
  });
  return state;
}
