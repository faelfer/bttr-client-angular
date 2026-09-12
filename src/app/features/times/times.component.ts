import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TimeEntry } from '../../core/models';
import { PageState } from '../../shared/page-state';
import { StatusComponent } from '../../shared/status.component';
import { DurationPipe } from '../../shared/duration.pipe';
@Component({
  selector: 'app-times',
  imports: [RouterLink, DatePipe, PaginatorModule, StatusComponent, DurationPipe],
  template: `
    <header class="page-heading">
      <div>
        <span class="eyebrow">CADA MINUTO CONTA</span>
        <h1>Histórico de tempo</h1>
        <p>Veja os pequenos passos que estão levando você adiante.</p>
      </div>
      <a class="button-link" routerLink="/times/create"
        ><i class="pi pi-plus" aria-hidden="true"></i>Registrar tempo</a
      >
    </header>
    <app-status [busy]="busy()" [error]="error()" [retryable]="true" (retry)="load()" />
    @if (loaded() && !error()) {
      <section class="panel history-panel">
        <div class="section-heading">
          <h2>
            Suas práticas <span class="count-badge">{{ count() }}</span>
          </h2>
          <span>Mais recentes primeiro</span>
        </div>
        @if (items().length) {
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Habilidade</th>
                  <th scope="col">Tempo dedicado</th>
                  <th scope="col">Data do registro</th>
                  <th scope="col"><span class="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                @for (time of items(); track time.id) {
                  <tr>
                    <td>
                      <a class="table-skill" [routerLink]="['/skills', time.skill.id, 'statistic']"
                        ><span class="tile-icon small"
                          ><i class="pi pi-book" aria-hidden="true"></i></span
                        >{{ time.skill.name }}</a
                      >
                    </td>
                    <td>
                      <span class="time-badge">{{ time.minutes | duration }}</span>
                    </td>
                    <td class="muted">{{ time.created | date: 'dd/MM/yyyy · HH:mm' }}</td>
                    <td>
                      <a
                        class="icon-link"
                        [routerLink]="['/times', time.id, 'update']"
                        [attr.aria-label]="'Editar registro de ' + time.skill.name"
                        ><i class="pi pi-pencil" aria-hidden="true"></i
                      ></a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="empty-state">
            <i class="pi pi-clock" aria-hidden="true"></i>
            <h3>Seu tempo conta uma história.</h3>
            <p>Registre sua primeira prática para começar.</p>
            <a class="text-link" routerLink="/times/create"
              >Registrar primeiro tempo <i class="pi pi-plus" aria-hidden="true"></i
            ></a>
          </div>
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
      </section>
    }
  `,
})
export class TimesComponent extends PageState implements OnInit {
  readonly items = signal<TimeEntry[]>([]);
  readonly count = signal(0);
  readonly page = signal(1);
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    void this.execute(async () => {
      const result = await this.api.times(this.page());
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
