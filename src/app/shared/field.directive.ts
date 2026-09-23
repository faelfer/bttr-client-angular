import { Directive, HostAttributeToken, inject, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
/** Convenção de id da mensagem de erro de um campo, compartilhada com o app-field-error. */
export function errorId(fieldId: string): string {
  return `${fieldId}-error`;
}
/** Liga um campo inválido à sua mensagem de erro para leitores de tela. */
@Directive({
  selector: 'input[appField]',
  host: {
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.aria-describedby]': 'invalid() ? errorId : null',
  },
})
export class FieldDirective {
  readonly control = input.required<AbstractControl>({ alias: 'appField' });
  readonly errorId = errorId(inject(new HostAttributeToken('id')));
  invalid(): boolean {
    const control = this.control();
    return control.touched && control.invalid;
  }
}
