import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FieldErrorComponent } from './field-error.component';
import { FieldDirective, errorId } from './field.directive';
@Component({
  imports: [ReactiveFormsModule, FieldDirective, FieldErrorComponent],
  template: `<input id="email" [appField]="control" [formControl]="control" /><app-field-error
      field="email"
      [control]="control"
      message="Informe um e-mail válido."
    />`,
})
class HostComponent {
  readonly control = new FormControl('', Validators.required);
}
describe('Acessibilidade das mensagens de erro', () => {
  let fixture: ComponentFixture<HostComponent>;
  const root = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const field = (): HTMLInputElement => {
    const element = root().querySelector('input');
    if (!element) throw new Error('O campo não foi renderizado.');
    return element;
  };
  const error = (): HTMLElement | null => root().querySelector('.field-error');
  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });
  it('mantém o campo silencioso enquanto não foi tocado', () => {
    expect(field().getAttribute('aria-invalid')).toBeNull();
    expect(field().getAttribute('aria-describedby')).toBeNull();
    expect(error()).toBeNull();
  });
  it('associa a mensagem ao campo quando ele fica inválido', () => {
    fixture.componentInstance.control.markAsTouched();
    fixture.detectChanges();
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(field().getAttribute('aria-describedby')).toBe('email-error');
    const message = error();
    expect(message?.id).toBe('email-error');
    expect(message?.getAttribute('role')).toBe('alert');
    expect(message?.textContent).toContain('Informe um e-mail válido.');
  });
  it('desfaz a associação quando o campo passa a ser válido', () => {
    fixture.componentInstance.control.markAsTouched();
    fixture.detectChanges();
    fixture.componentInstance.control.setValue('pessoa@exemplo.com');
    fixture.detectChanges();
    expect(field().getAttribute('aria-invalid')).toBeNull();
    expect(field().getAttribute('aria-describedby')).toBeNull();
    expect(error()).toBeNull();
  });
  it('deriva o id da mensagem do id do campo', () => {
    expect(errorId('minutes')).toBe('minutes-error');
  });
});
