import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProgressBarModule } from 'primeng/progressbar';
import { PageState } from '../../shared/page-state';
import { StatusComponent } from '../../shared/status.component';
import { DurationPipe } from '../../shared/duration.pipe';
import { monthRange, statistics } from '../../shared/statistics';
import { Skill } from '../../core/models';
@Component({
  selector: 'app-statistics',
  imports: [RouterLink, DatePipe, ProgressBarModule, StatusComponent, DurationPipe],
  template: `
    <a class="back-link" routerLink="/home"
      ><i class="pi pi-arrow-left" aria-hidden="true"></i>Voltar às habilidades</a
    >
    <header class="page-heading">
      <div>
        <span class="eyebrow">SEU PROGRESSO EM FOCO</span>
        <h1>{{ skill()?.name || 'Estatísticas' }}</h1>
        <p class="capitalize">
          {{ today | date: 'MMMM yyyy' }} · Cada prática aproxima você da sua meta.
        </p>
      </div>
      @if (skill()) {
        <a class="button-link" routerLink="/times/create" [queryParams]="{ skillId: id }"
          ><i class="pi pi-plus" aria-hidden="true"></i>Registrar tempo</a
        >
      }
    </header>
    <app-status [busy]="busy()" [error]="error()" [retryable]="true" (retry)="load()" />
    @if (loaded() && !error()) {
      @if (progress(); as stats) {
        <div class="metric-grid">
          <section class="metric">
            <span>Tempo dedicado no mês</span><strong>{{ stats.total | duration }}</strong
            ><small>Todo esforço conta</small>
          </section>
          <section class="metric">
            <span>Meta mensal</span><strong>{{ stats.goal | duration }}</strong
            ><small>{{ stats.businessDays }} dias úteis de prática</small>
          </section>
          <section class="metric">
            <span>Meta diária</span><strong>{{ skill()!.daily | duration }}</strong
            ><small>De segunda a sexta-feira</small>
          </section>
        </div>
        <section class="panel progress-panel">
          <div class="section-heading">
            <div>
              <h2>Sua evolução neste mês</h2>
              <p>{{ stats.message }}</p>
            </div>
            <strong class="percentage">{{ stats.percentage }}%</strong>
          </div>
          <p-progressbar
            [value]="cappedPercentage()"
            [showValue]="false"
            aria-label="Progresso da meta mensal"
          />
          <div class="progress-legend">
            <span>{{ stats.total | duration }} de prática</span
            ><span>Meta: {{ stats.goal | duration }}</span>
          </div>
        </section>
        <div class="form-grid">
          <section class="panel">
            <h2>Seu ritmo até hoje</h2>
            <dl class="stat-details">
              <div>
                <dt>Acumulado esperado</dt>
                <dd>{{ stats.ideal | duration }}</dd>
              </div>
              <div>
                <dt>Falta para o acumulado de hoje</dt>
                <dd>{{ stats.missing | duration }}</dd>
              </div>
              <div>
                <dt>Falta para a meta do mês</dt>
                <dd>{{ stats.remaining | duration }}</dd>
              </div>
            </dl>
          </section>
          <aside class="tip-panel">
            <i class="pi pi-sparkles" aria-hidden="true"></i>
            <h2>{{ stats.remaining ? 'Uma sugestão para seguir.' : 'Você chegou lá!' }}</h2>
            @if (stats.remaining) {
              <p>
                Dedique cerca de <strong>{{ stats.suggestion | duration }}</strong> por dia útil
                restante para alcançar sua meta mensal.
              </p>
            } @else {
              <p>Sua meta mensal foi alcançada. Aproveite essa conquista e continue aprendendo.</p>
            }
            <small>As metas consideram segunda a sexta, sem descontar feriados.</small>
          </aside>
        </div>
      }
    }
  `,
})
export class StatisticsComponent extends PageState implements OnInit {
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('skillId')!;
  readonly today = new Date();
  readonly skill = signal<Skill | null>(null);
  readonly total = signal(0);
  readonly progress = computed(() =>
    this.skill() ? statistics(this.skill()!.daily, this.total(), this.today) : null,
  );
  readonly cappedPercentage = computed(() => Math.min(100, this.progress()?.percentage ?? 0));
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    void this.execute(async () => {
      const range = monthRange(this.today);
      const [skill, times] = await Promise.all([
        this.api.skill(this.id),
        this.api.timesByDate(this.id, range.initial, range.final),
      ]);
      this.skill.set(skill.skill);
      this.total.set(times.times.reduce((total, time) => total + time.minutes, 0));
      this.loaded.set(true);
    });
  }
}
