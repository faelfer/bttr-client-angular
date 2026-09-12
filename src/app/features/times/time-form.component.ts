import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { PageState } from '../../shared/page-state';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { StatusComponent } from '../../shared/status.component';
import { minutesValidator } from '../../shared/validators';
import { Skill } from '../../core/models';
@Component({
  selector: 'app-time-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectModule,
    FieldErrorComponent,
    StatusComponent,
  ],
  template: `
    <a class="back-link" routerLink="/times"
      ><i class="pi pi-arrow-left" aria-hidden="true"></i>Voltar ao histórico</a
    >
    <header class="page-heading">
      <div>
        <span class="eyebrow">TEMPO BEM INVESTIDO</span>
        <h1>{{ id ? 'Editar tempo' : 'Registrar tempo' }}</h1>
        <p>Celebre mais um momento dedicado a você.</p>
      </div>
    </header>
    <app-status [busy]="busy()" [error]="error()" [retryable]="!loaded()" (retry)="load()" />
    @if (loaded()) {
      @if (skills().length) {
        <div class="form-grid">
          <section class="panel">
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <div class="field">
                <label for="skill">Habilidade</label
                ><p-select
                  inputId="skill"
                  ariaLabel="Habilidade"
                  formControlName="skill_id"
                  [options]="skills()"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Selecione uma habilidade"
                  [filter]="true"
                  filterBy="name"
                  ariaFilterLabel="Buscar habilidade"
                  appendTo="body"
                /><app-field-error
                  [control]="form.controls.skill_id"
                  message="Selecione uma habilidade."
                />
              </div>
              <div class="field">
                <label for="minutes">Tempo dedicado em minutos</label
                ><input
                  pInputText
                  id="minutes"
                  formControlName="minutes"
                  type="number"
                  min="1"
                  max="1440"
                  step="1"
                  placeholder="Ex.: 25"
                /><small>O registro usa a data atual. A edição preserva a data original.</small
                ><app-field-error
                  [control]="form.controls.minutes"
                  message="Informe minutos inteiros entre 1 e 1440."
                />
              </div>
              <div class="form-actions">
                <p-button
                  [ariaLabel]="id ? 'Salvar alterações' : 'Registrar tempo'"
                  [label]="id ? 'Salvar alterações' : 'Registrar tempo'"
                  type="submit"
                  icon="pi pi-check"
                  [loading]="busy()"
                  [disabled]="busy()"
                /><a routerLink="/times">Cancelar</a>
              </div>
            </form>
            @if (id) {
              <div class="delete-section">
                <p-button
                  ariaLabel="Excluir registro"
                  label="Excluir registro"
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
            <i class="pi pi-clock" aria-hidden="true"></i>
            <h2>Todo tempo dedicado é progresso.</h2>
            <p>
              Uma sessão curta também conta. Registre sua prática e acompanhe sua evolução ao longo
              do mês.
            </p>
            <span>SEU ESFORÇO MERECE SER VISTO</span>
          </aside>
        </div>
      } @else {
        <section class="panel empty-state">
          <h2>Primeiro, escolha o que quer aprender.</h2>
          <p>Você precisa criar uma habilidade antes de registrar tempo.</p>
          <a class="button-link" routerLink="/skills/create">Criar habilidade</a>
        </section>
      }
    }
  `,
})
export class TimeFormComponent extends PageState implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly id = this.route.snapshot.paramMap.get('timeId');
  readonly skills = signal<Skill[]>([]);
  readonly form = inject(FormBuilder).group({
    skill_id: [null as number | null, [Validators.required, Validators.min(1)]],
    minutes: [25, minutesValidator],
  });
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    void this.execute(async () => {
      const [skills, entry] = await Promise.all([
        this.api.allSkills(),
        this.id ? this.api.time(this.id) : Promise.resolve(null),
      ]);
      this.skills.set(skills.skills);
      if (entry)
        this.form.patchValue({ skill_id: entry.time.skill.id, minutes: entry.time.minutes });
      else {
        const selected = Number(this.route.snapshot.queryParamMap.get('skillId'));
        if (skills.skills.some((skill) => skill.id === selected))
          this.form.patchValue({ skill_id: selected });
      }
      this.loaded.set(true);
    });
  }
  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { skill_id, minutes } = this.form.getRawValue();
    if (skill_id === null || minutes === null) return;
    void this.execute(async () => {
      this.success(
        await (this.id
          ? this.api.updateTime(this.id, { skill_id, minutes })
          : this.api.createTime({ skill_id, minutes })),
      );
      await this.router.navigateByUrl('/times');
    });
  }
  remove(): void {
    if (!this.id) return;
    const id = this.id;
    this.confirmDelete(
      'Excluir este registro de tempo? Esta ação não pode ser desfeita.',
      async () => {
        this.success(await this.api.deleteTime(id));
        await this.router.navigateByUrl('/times');
      },
    );
  }
}
