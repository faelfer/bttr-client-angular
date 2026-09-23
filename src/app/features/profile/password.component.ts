import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PageState } from '../../shared/page-state';
import { StatusComponent } from '../../shared/status.component';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { FieldDirective } from '../../shared/field.directive';
import { passwordMatch, passwordValidators } from '../../shared/validators';
@Component({
  selector: 'app-password',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    StatusComponent,
    FieldErrorComponent,
    FieldDirective,
  ],
  template: `
    <a class="back-link" routerLink="/profile"
      ><i class="pi pi-arrow-left" aria-hidden="true"></i>Voltar ao perfil</a
    >
    <header class="page-heading">
      <div>
        <span class="eyebrow">SEGURANÇA</span>
        <h1>Alterar senha</h1>
        <p>Escolha uma nova senha para proteger sua conta.</p>
      </div>
    </header>
    <app-status [busy]="busy()" [error]="error()" />
    <section class="panel form-panel">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="current">Senha atual</label
          ><input
            pInputText
            id="current"
            [appField]="form.controls.password"
            type="password"
            autocomplete="current-password"
            formControlName="password"
          /><app-field-error
            field="current"
            [control]="form.controls.password"
            message="Informe sua senha atual."
          />
        </div>
        <div class="field">
          <label for="new">Nova senha</label
          ><input
            pInputText
            id="new"
            [appField]="form.controls.new_password"
            type="password"
            autocomplete="new-password"
            formControlName="new_password"
          /><small>De 4 a 128 caracteres, com maiúscula, minúscula, número e símbolo.</small
          ><app-field-error
            field="new"
            [control]="form.controls.new_password"
            message="A nova senha deve atender aos requisitos acima."
          />
        </div>
        <div class="field">
          <label for="confirm">Confirmar nova senha</label
          ><input
            pInputText
            id="confirm"
            [appField]="form.controls.confirmation"
            type="password"
            autocomplete="new-password"
            formControlName="confirmation"
          /><app-field-error
            field="confirm"
            [control]="form.controls.confirmation"
            message="Confirme sua nova senha."
          />
          @if (form.controls.confirmation.touched && form.hasError('passwordMatch')) {
            <small class="field-error" role="alert">As senhas não coincidem.</small>
          }
        </div>
        <p-button
          ariaLabel="Salvar nova senha"
          label="Salvar nova senha"
          type="submit"
          [disabled]="busy()"
          [loading]="busy()"
        />
      </form>
    </section>
  `,
})
export class PasswordComponent extends PageState {
  readonly form = inject(FormBuilder).nonNullable.group(
    {
      password: ['', [Validators.required, Validators.maxLength(128)]],
      new_password: ['', passwordValidators],
      confirmation: ['', Validators.required],
    },
    { validators: passwordMatch },
  );
  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    void this.execute(async () => {
      const { password, new_password } = this.form.getRawValue();
      this.success(await this.api.redefinePassword({ password, new_password }));
      this.form.reset();
      await this.router.navigateByUrl('/profile');
    });
  }
}
