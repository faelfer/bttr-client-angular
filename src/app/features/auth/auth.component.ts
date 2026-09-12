import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PageState } from '../../shared/page-state';
import { StatusComponent } from '../../shared/status.component';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { nonBlank, passwordValidators } from '../../shared/validators';
import { SessionService } from '../../core/session.service';
import { safeReturnUrl } from '../../core/auth';
@Component({
  selector: 'app-auth',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    StatusComponent,
    FieldErrorComponent,
  ],
  templateUrl: './auth.component.html',
})
export class AuthComponent extends PageState {
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionService);
  readonly mode: 'signin' | 'signup' | 'forgot' = this.route.snapshot.data['mode'];
  readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', this.mode === 'signup' ? [nonBlank, Validators.maxLength(100)] : []],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: [
      '',
      this.mode === 'signup'
        ? passwordValidators
        : this.mode === 'signin'
          ? [Validators.required, Validators.maxLength(128)]
          : [],
    ],
  });
  readonly heading =
    this.mode === 'signup'
      ? 'Comece sua evolução.'
      : this.mode === 'forgot'
        ? 'Vamos recuperar seu acesso.'
        : 'Bom ter você de volta.';
  readonly subtitle =
    this.mode === 'signup'
      ? 'Crie sua conta e dê espaço a novas habilidades.'
      : this.mode === 'forgot'
        ? 'Enviaremos um link para redefinir sua senha por e-mail.'
        : 'Entre para continuar investindo em você.';
  readonly submitLabel =
    this.mode === 'signup'
      ? 'Criar minha conta'
      : this.mode === 'forgot'
        ? 'Enviar link de recuperação'
        : 'Entrar';
  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    void this.execute(async () => {
      const { username, email, password } = this.form.getRawValue();
      if (this.mode === 'signin') {
        const result = await this.api.signIn({ email: email.trim(), password });
        if (!result.token) throw new Error('Token ausente');
        this.session.set(result.token);
        await this.router.navigateByUrl(
          safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')),
        );
      } else if (this.mode === 'signup') {
        this.success(
          await this.api.signUp({ username: username.trim(), email: email.trim(), password }),
        );
        await this.router.navigateByUrl('/');
      } else {
        this.success(await this.api.forgotPassword(email.trim()));
      }
    });
  }
}
