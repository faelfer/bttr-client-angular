import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PageState } from '../../shared/page-state';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { FieldDirective } from '../../shared/field.directive';
import { StatusComponent } from '../../shared/status.component';
import { minutesValidator, nonBlank } from '../../shared/validators';
@Component({
  selector: 'app-skill-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    FieldErrorComponent,
    FieldDirective,
    StatusComponent,
  ],
  template: `
    <a class="back-link" routerLink="/home"
      ><i class="pi pi-arrow-left" aria-hidden="true"></i>Voltar às habilidades</a
    >
    <header class="page-heading">
      <div>
        <span class="eyebrow">UM NOVO PASSO</span>
        <h1>{{ id ? 'Editar habilidade' : 'Nova habilidade' }}</h1>
        <p>Defina uma intenção. Transforme em prática.</p>
      </div>
    </header>
    <app-status [busy]="busy()" [error]="error()" [retryable]="!loaded()" (retry)="load()" />
    @if (loaded()) {
      <div class="form-grid">
        <section class="panel">
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="field">
              <label for="name">Nome da habilidade</label
              ><input
                pInputText
                id="name"
                [appField]="form.controls.name"
                formControlName="name"
                placeholder="Ex.: Inglês, programação, violão…"
                maxlength="120"
              /><app-field-error
                field="name"
                [control]="form.controls.name"
                message="Informe um nome entre 2 e 120 caracteres."
              />
            </div>
            <div class="field">
              <label for="daily">Meta diária em minutos</label
              ><input
                pInputText
                id="daily"
                [appField]="form.controls.daily"
                type="number"
                formControlName="daily"
                min="1"
                max="1440"
                step="1"
                placeholder="Ex.: 30"
              /><small>Tempo que você deseja dedicar em cada dia útil.</small
              ><app-field-error
                field="daily"
                [control]="form.controls.daily"
                message="Informe minutos inteiros entre 1 e 1440."
              />
            </div>
            <div class="form-actions">
              <p-button
                [ariaLabel]="id ? 'Salvar alterações' : 'Criar habilidade'"
                [label]="id ? 'Salvar alterações' : 'Criar habilidade'"
                type="submit"
                icon="pi pi-check"
                [loading]="busy()"
                [disabled]="busy()"
              /><a routerLink="/home">Cancelar</a>
            </div>
          </form>
          @if (id) {
            <div class="delete-section">
              <p-button
                ariaLabel="Excluir habilidade"
                label="Excluir habilidade"
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [disabled]="busy()"
                (onClick)="remove()"
              />
            </div>
          }
        </section>
        <aside class="tip-panel">
          <i class="pi pi-lightbulb" aria-hidden="true"></i>
          <h2>Comece com uma meta possível.</h2>
          <p>
            Quinze minutos por dia já fazem diferença. O mais importante é conseguir voltar amanhã.
          </p>
          <span>CONSTÂNCIA VALE MAIS QUE INTENSIDADE</span>
        </aside>
      </div>
    }
  `,
})
export class SkillFormComponent extends PageState implements OnInit {
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('skillId');
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [nonBlank, Validators.maxLength(120)]],
    daily: [30, minutesValidator],
  });
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    void this.execute(async () => {
      if (this.id) this.form.patchValue((await this.api.skill(this.id)).skill);
      this.loaded.set(true);
    });
  }
  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    void this.execute(async () => {
      const value = this.form.getRawValue();
      const body = { ...value, name: value.name.trim() };
      this.success(
        await (this.id ? this.api.updateSkill(this.id, body) : this.api.createSkill(body)),
      );
      await this.router.navigateByUrl('/home');
    });
  }
  remove(): void {
    if (!this.id) return;
    const id = this.id;
    this.confirmDelete(
      'Excluir esta habilidade e todos os seus registros de tempo? Esta ação não pode ser desfeita.',
      async () => {
        this.success(await this.api.deleteSkill(id));
        await this.router.navigateByUrl('/home');
      },
    );
  }
}
