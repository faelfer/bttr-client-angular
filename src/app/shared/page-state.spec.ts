import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';
import { APP_CONFIG } from '../core/config';
import { PageState, errorMessage } from './page-state';
@Component({ template: '' })
class HostComponent extends PageState {
  run(action: () => Promise<void>): Promise<void> {
    return this.execute(action);
  }
  notify(message: string): void {
    this.success({ message });
  }
  remove(action: () => Promise<void>): void {
    this.confirmDelete('Excluir?', action);
  }
}
describe('Estado compartilhado das telas', () => {
  let host: HostComponent;
  let messages: MessageService;
  let confirmations: ConfirmationService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        ConfirmationService,
        { provide: APP_CONFIG, useValue: { apiUrl: '/api' } },
      ],
    });
    host = TestBed.createComponent(HostComponent).componentInstance;
    messages = TestBed.inject(MessageService);
    confirmations = TestBed.inject(ConfirmationService);
  });
  describe('errorMessage', () => {
    it('explica a falha de conexão quando não há resposta', () => {
      expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('conectar ao servidor');
    });
    it('prefere a mensagem devolvida pela API', () => {
      const error = new HttpErrorResponse({ status: 422, error: { message: 'e-mail já usado.' } });
      expect(errorMessage(error)).toBe('e-mail já usado.');
    });
    it.each([
      [{ status: 404, error: null }, 'Registro não encontrado.'],
      [{ status: 404, error: { message: 42 } }, 'Registro não encontrado.'],
      [
        { status: 500, error: 'texto puro' },
        'Não foi possível concluir a operação. Tente novamente.',
      ],
    ])('usa a mensagem padrão quando a API não descreve o erro: %s', (init, expected) => {
      expect(errorMessage(new HttpErrorResponse(init))).toBe(expected);
    });
    it('não vaza detalhes de erros que não são HTTP', () => {
      expect(errorMessage(new Error('stack interno'))).toBe(
        'Não foi possível concluir a operação. Tente novamente.',
      );
    });
  });
  // O HttpClient rejeita com HttpErrorResponse, que não estende Error.
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
  const offline = (): Promise<void> => Promise.reject(new HttpErrorResponse({ status: 0 }));
  describe('execute', () => {
    it('marca ocupado durante a ação e libera ao final', async () => {
      expect(host.busy()).toBe(false);
      let busyDuringAction = false;
      await host.run(() => {
        busyDuringAction = host.busy();
        return Promise.resolve();
      });
      expect(busyDuringAction).toBe(true);
      expect(host.busy()).toBe(false);
      expect(host.error()).toBe('');
    });
    it('converte a falha em mensagem e libera o botão', async () => {
      await host.run(offline);
      expect(host.error()).toContain('conectar ao servidor');
      expect(host.busy()).toBe(false);
    });
    it('limpa o erro anterior ao tentar de novo', async () => {
      await host.run(offline);
      await host.run(() => Promise.resolve());
      expect(host.error()).toBe('');
    });
    it('ignora uma segunda ação enquanto a primeira não termina', async () => {
      const action = jest.fn().mockResolvedValue(undefined);
      let release = (): void => undefined;
      const pending = host.run(() => new Promise<void>((resolve) => (release = resolve)));
      await host.run(action);
      expect(action).not.toHaveBeenCalled();
      release();
      await pending;
      await host.run(action);
      expect(action).toHaveBeenCalledTimes(1);
    });
  });
  it('anuncia sucesso com a mensagem da API', () => {
    const add = jest.spyOn(messages, 'add');
    host.notify('habilidade criada com sucesso.');
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', detail: 'habilidade criada com sucesso.' }),
    );
  });
  describe('confirmDelete', () => {
    it('só executa a exclusão depois do aceite', async () => {
      let confirmation: Confirmation | undefined;
      jest.spyOn(confirmations, 'confirm').mockImplementation((value) => {
        confirmation = value;
        return confirmations;
      });
      const action = jest.fn().mockResolvedValue(undefined);
      host.remove(action);
      expect(action).not.toHaveBeenCalled();
      expect(confirmation?.message).toBe('Excluir?');
      confirmation?.accept?.();
      await Promise.resolve();
      expect(action).toHaveBeenCalledTimes(1);
    });
  });
});
