import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
@Component({
  selector: 'app-field-error',
  template: `@if (control().touched && control().invalid) {
    <small class="field-error" role="alert">{{ message() }}</small>
  }`,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();
  readonly message = input('Preencha este campo corretamente.');
}
