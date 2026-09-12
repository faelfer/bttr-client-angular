import { Directive, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiService } from '../core/api.service';
import { Message } from '../core/models';
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0)
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
    if (typeof error.error?.message === 'string') return error.error.message;
    if (error.status === 404) return 'Registro não encontrado.';
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}
@Directive()
export abstract class PageState {
  protected readonly api = inject(ApiService);
  protected readonly router = inject(Router);
  protected readonly messages = inject(MessageService);
  protected readonly confirmations = inject(ConfirmationService);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly loaded = signal(false);
  protected async execute(action: () => Promise<void>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await action();
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
  protected success(response: Message): void {
    this.messages.add({ severity: 'success', summary: 'Tudo certo', detail: response.message });
  }
  protected confirmDelete(message: string, action: () => Promise<void>): void {
    this.confirmations.confirm({
      header: 'Confirmar exclusão',
      message,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, excluir',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        void this.execute(action);
      },
    });
  }
}
