import { InjectionToken } from '@angular/core';
export interface AppConfig {
  apiUrl: string;
}
export const APP_CONFIG = new InjectionToken<AppConfig>('BTTR_CONFIG');

export async function loadConfig(): Promise<AppConfig> {
  const response = await fetch('/config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível carregar a configuração da aplicação.');
  const config: unknown = await response.json();
  if (
    !config ||
    typeof config !== 'object' ||
    !('apiUrl' in config) ||
    typeof config.apiUrl !== 'string'
  ) {
    throw new Error('Configure apiUrl em config.json.');
  }
  const apiUrl = config.apiUrl.replace(/\/+$/, '');
  if (
    !apiUrl ||
    !((apiUrl.startsWith('/') && !apiUrl.startsWith('//')) || /^https?:\/\//.test(apiUrl))
  ) {
    throw new Error('apiUrl deve ser um caminho absoluto ou uma URL HTTP(S).');
  }
  return { apiUrl };
}
