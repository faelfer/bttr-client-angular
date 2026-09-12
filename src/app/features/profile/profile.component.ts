import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PageState } from '../../shared/page-state';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { StatusComponent } from '../../shared/status.component';
import { nonBlank } from '../../shared/validators';
import { SessionService } from '../../core/session.service';
@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    FieldErrorComponent,
    StatusComponent,
  ],
  template: `
    <header class="page-heading">
      <div>
        <span class="eyebrow">SUA CONTA</span>
        <h1>Meu perfil</h1>
        <p>Um espaço para cuidar das suas informações.</p>
      </div>
    </header>
    <app-status [busy]="busy()" [error]="error()" [retryable]="!loaded()" (retry)="load()" />
    @if (loaded()) {
      <div class="form-grid">
        <section class="panel">
          <div class="panel-heading">
            <span class="tile-icon"><i class="pi pi-user" aria-hidden="true"></i></span>
            <div>
              <h2>Informações pessoais</h2>
              <p>Mantenha seus dados atualizados.</p>
            </div>
          </div>
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="field">
              <label for="username">Nome de usuário</label
              ><input
                pInputText
                id="username"
                formControlName="username"
                autocomplete="username"
              /><app-field-error
                [control]="form.controls.username"
                message="Informe um nome entre 2 e 100 caracteres."
              />
            </div>
            <div class="field">
              <label for="email">E-mail</label
              ><input
                pInputText
                id="email"
                type="email"
                formControlName="email"
                autocomplete="email"
              /><app-field-error
                [control]="form.controls.email"
                message="Informe um e-mail válido."
              />
            </div>
            <p-button
              ariaLabel="Salvar alterações"
              type="submit"
              label="Salvar alterações"
              icon="pi pi-check"
              [loading]="busy()"
              [disabled]="busy()"
            />
          </form>
        </section>
        <aside class="form-aside">
          <section class="panel">
            <h2>Segurança</h2>
            <p>Atualize sua senha sempre que precisar.</p>
            <a class="text-link" routerLink="/redefine-password"
              >Alterar senha <i class="pi pi-arrow-right" aria-hidden="true"></i
            ></a>
          </section>
          <section class="panel danger-zone">
            <h2>Excluir conta</h2>
            <p>Sua conta, habilidades e registros de tempo serão apagados permanentemente.</p>
            <p-button
              ariaLabel="Excluir minha conta"
              label="Excluir minha conta"
              severity="danger"
              [outlined]="true"
              [disabled]="busy()"
              (onClick)="remove()"
            />
          </section>
        </aside>
      </div>
    }
  `,
})
export class ProfileComponent extends PageState implements OnInit {
  private readonly session = inject(SessionService);
  readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', [nonBlank, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
  });
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    void this.execute(async () => {
      this.form.patchValue((await this.api.profile()).user);
      this.loaded.set(true);
    });
  }
  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    void this.execute(async () => {
      const value = this.form.getRawValue();
      this.success(
        await this.api.updateProfile({
          username: value.username.trim(),
          email: value.email.trim(),
        }),
      );
    });
  }
  remove(): void {
    this.confirmDelete(
      'Excluir sua conta e todos os seus dados? Esta ação não pode ser desfeita.',
      async () => {
        this.success(await this.api.deleteProfile());
        this.session.clear();
        await this.router.navigateByUrl('/');
      },
    );
  }
}
