import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `<main class="not-found">
    <a class="brand" routerLink="/">bttr.</a>
    <p class="eyebrow">404</p>
    <h1>Esse caminho ainda não existe.</h1>
    <p>A página que você procura não foi encontrada.</p>
    <a class="button-link" routerLink="/home"
      >Voltar ao início <i class="pi pi-arrow-right" aria-hidden="true"></i
    ></a>
  </main>`,
})
export class NotFoundComponent {}
