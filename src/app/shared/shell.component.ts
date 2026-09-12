import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SessionService } from '../core/session.service';
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ButtonModule],
  template: `
    <a class="skip-link" href="#main">Pular para o conteúdo</a>
    <aside class="sidebar">
      <a class="brand" routerLink="/home" aria-label="Bttr início"
        ><span class="brand-icon"><i class="pi pi-chart-bar" aria-hidden="true"></i></span>bttr<span
          class="brand-dot"
          >.</span
        ></a
      >
      <span class="nav-caption">SEU ESPAÇO DE EVOLUÇÃO</span>
      <nav aria-label="Navegação principal">
        <a routerLink="/home" routerLinkActive="active"
          ><i class="pi pi-th-large" aria-hidden="true"></i>Habilidades</a
        >
        <a routerLink="/times" routerLinkActive="active"
          ><i class="pi pi-clock" aria-hidden="true"></i>Histórico de tempo</a
        >
        <a routerLink="/profile" routerLinkActive="active"
          ><i class="pi pi-user" aria-hidden="true"></i>Meu perfil</a
        >
      </nav>
      <div class="sidebar-bottom">
        <div class="daily-note">
          <i class="pi pi-sparkles" aria-hidden="true"></i
          ><strong>Pequenos passos.<br />Grandes mudanças.</strong>
          <p>Reserve um tempo para o que você quer se tornar.</p>
        </div>
        <p-button
          ariaLabel="Sair da conta"
          label="Sair da conta"
          icon="pi pi-sign-out"
          severity="secondary"
          [text]="true"
          (onClick)="logout()"
        />
      </div>
    </aside>
    <div class="workspace">
      <header class="topbar">
        <span>Um pouco melhor, todos os dias.</span
        ><span class="topbar-badge"><span></span>Seu próximo passo começa aqui</span>
      </header>
      <main id="main" tabindex="-1"><router-outlet /></main>
      <footer>Feito de tempo, dedicação e você. <span>bttr.</span></footer>
    </div>
  `,
})
export class ShellComponent {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  logout(): void {
    this.session.clear();
    void this.router.navigateByUrl('/');
  }
}
