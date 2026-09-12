import { Injectable, computed, signal } from '@angular/core';
export const SESSION_KEY = 'bttr.token';
@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly token = signal<string | null>(this.read());
  readonly authenticated = computed(() => !!this.token());
  private read(): string | null {
    try {
      return localStorage.getItem(SESSION_KEY) || null;
    } catch {
      return null;
    }
  }
  set(token: string): void {
    this.token.set(token);
    try {
      localStorage.setItem(SESSION_KEY, token);
    } catch {
      /* Session remains available in memory. */
    }
  }
  clear(): void {
    this.token.set(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* Storage can be unavailable. */
    }
  }
}
