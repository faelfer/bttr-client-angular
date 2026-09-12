import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { Skill } from '../../core/models';
import { PageState } from '../../shared/page-state';
import { StatusComponent } from '../../shared/status.component';
import { DurationPipe } from '../../shared/duration.pipe';
@Component({
  selector: 'app-skills',
  imports: [RouterLink, ButtonModule, PaginatorModule, StatusComponent, DurationPipe],
  template: `
    <header class="page-heading">
      <div>
        <span class="eyebrow">PRATIQUE. APRENDA. EVOLUA.</span>
        <h1>Minhas habilidades</h1>
        <p>O que você quer fazer um pouco melhor hoje?</p>
      </div>
      <a class="button-link" routerLink="/skills/create"
        ><i class="pi pi-plus" aria-hidden="true"></i>Nova habilidade</a
      >
    </header>
    <section class="welcome-banner">
      <div>
        <span class="banner-tag">CONSTRUA SUA CONSTÂNCIA</span>
        <h2>Seu futuro começa<br />com o tempo de hoje.</h2>
        <p>Escolha uma habilidade e dê o próximo passo.</p>
        <a routerLink="/times/create"
          >Registrar meu tempo <i class="pi pi-arrow-up-right" aria-hidden="true"></i
        ></a>
      </div>
      <div class="banner-art" aria-hidden="true">
        <div class="orbit"></div>
        <i class="pi pi-arrow-up-right"></i><span class="art-label">1% melhor a cada dia</span>
      </div>
    </section>
    <div class="section-heading">
      <h2>
        Suas habilidades <span class="count-badge">{{ count() }}</span>
      </h2>
      <span>Uma prática de cada vez</span>
    </div>
    <app-status [busy]="busy()" [error]="error()" [retryable]="true" (retry)="load()" />
    @if (loaded() && !error()) {
      @if (items().length) {
        <div class="skill-grid">
          @for (skill of items(); track skill.id; let index = $index) {
            <article class="skill-card">
              <div class="skill-card-top">
                <span
                  class="tile-icon"
                  [class.lavender]="index % 3 === 1"
                  [class.peach]="index % 3 === 2"
                  ><i [class]="'pi ' + icons[index % icons.length]" aria-hidden="true"></i></span
                ><a
                  [routerLink]="['/skills', skill.id, 'update']"
                  class="icon-link"
                  [attr.aria-label]="'Editar ' + skill.name"
                  ><i class="pi pi-pencil" aria-hidden="true"></i
                ></a>
              </div>
              <h3>{{ skill.name }}</h3>
              <p>
                <i class="pi pi-clock" aria-hidden="true"></i> {{ skill.daily | duration }}
                <span>/ dia útil</span>
              </p>
              <div class="card-divider"></div>
              <a class="card-action" [routerLink]="['/skills', skill.id, 'statistic']"
                >Ver estatísticas<i class="pi pi-arrow-right" aria-hidden="true"></i
              ></a>
            </article>
          }
        </div>
      } @else {
        <section class="empty-state">
          <span class="tile-icon"><i class="pi pi-sparkles" aria-hidden="true"></i></span>
          <h3>Sua próxima habilidade começa aqui.</h3>
          <p>Crie uma habilidade e defina sua meta diária de prática.</p>
          <a class="text-link" routerLink="/skills/create"
            >Criar primeira habilidade <i class="pi pi-plus" aria-hidden="true"></i
          ></a>
        </section>
      }
      @if (count() > 5) {
        <p-paginator
          [rows]="5"
          [totalRecords]="count()"
          [first]="(page() - 1) * 5"
          (onPageChange)="changePage($event)"
          [showFirstLastIcon]="false"
        />
      }
    }
  `,
})
export class SkillsComponent extends PageState implements OnInit {
  readonly items = signal<Skill[]>([]);
  readonly count = signal(0);
  readonly page = signal(1);
  readonly icons = ['pi-book', 'pi-code', 'pi-palette', 'pi-language', 'pi-star'];
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    void this.execute(async () => {
      const result = await this.api.skills(this.page());
      this.items.set(result.results);
      this.count.set(result.count);
      this.loaded.set(true);
    });
  }
  changePage(event: PaginatorState): void {
    if (this.busy()) return;
    this.page.set((event.page ?? 0) + 1);
    this.load();
  }
}
