import { registerLocaleData } from '@angular/common';
import pt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { APP_CONFIG, loadConfig } from './app/core/config';
import { authInterceptor } from './app/core/auth';
registerLocaleData(pt);
const theme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{emerald.50}',
      100: '{emerald.100}',
      200: '{emerald.200}',
      300: '{emerald.300}',
      400: '{emerald.400}',
      500: '#18765a',
      600: '#14634c',
      700: '#10533f',
      800: '#104333',
      900: '#12392e',
      950: '#05251b',
    },
  },
});
loadConfig()
  .then((config) =>
    bootstrapApplication(AppComponent, {
      providers: [
        { provide: APP_CONFIG, useValue: config },
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
        providePrimeNG({
          theme: { preset: theme, options: { darkModeSelector: false } },
          translation: {
            accept: 'Confirmar',
            reject: 'Cancelar',
            emptyMessage: 'Nenhum resultado encontrado',
            emptySearchMessage: 'Nenhum resultado encontrado',
            startsWith: 'Começa com',
            contains: 'Contém',
            aria: {
              close: 'Fechar',
              previous: 'Anterior',
              next: 'Próximo',
              pageLabel: 'Página {page}',
              firstPageLabel: 'Primeira página',
              lastPageLabel: 'Última página',
              nextPageLabel: 'Próxima página',
              prevPageLabel: 'Página anterior',
              previousPageLabel: 'Página anterior',
              navigation: 'Paginação',
            },
          },
        }),
        MessageService,
        ConfirmationService,
      ],
    }),
  )
  .catch(() => {
    const root = document.querySelector('app-root');
    if (root)
      root.textContent =
        'Não foi possível iniciar o Bttr. Verifique config.json e recarregue a página.';
  });
