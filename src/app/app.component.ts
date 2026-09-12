import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  template: `<p-toast
      position="top-right"
      [breakpoints]="{ '600px': { width: 'calc(100% - 2rem)', right: '1rem' } }"
    /><p-confirmdialog
      [style]="{ width: '28rem', maxWidth: 'calc(100vw - 2rem)' }"
      [defaultFocus]="'reject'"
    /><router-outlet />`,
})
export class AppComponent {}
