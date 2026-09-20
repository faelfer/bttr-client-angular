import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
@Component({
  selector: 'app-status',
  imports: [ButtonModule, ProgressBarModule],
  template: `
    @if (busy()) {
      <div class="loading" role="status" aria-label="Carregando">
        <p-progressbar mode="indeterminate" [style]="{ height: '3px' }" /><span>Carregando…</span>
      </div>
    }
    @if (error()) {
      <div class="error-banner" role="alert">
        <i class="pi pi-exclamation-circle" aria-hidden="true"></i><span>{{ error() }}</span>
        @if (retryable()) {
          <p-button
            ariaLabel="Tentar novamente"
            label="Tentar novamente"
            severity="danger"
            [text]="true"
            (onClick)="retry.emit()"
          />
        }
      </div>
    }
  `,
})
export class StatusComponent {
  readonly busy = input(false);
  readonly error = input('');
  readonly retryable = input(false);
  readonly retry = output();
}
