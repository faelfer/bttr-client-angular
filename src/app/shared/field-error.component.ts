import { Component, computed, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { errorId } from './field.directive';
@Component({
  selector: 'app-field-error',
  template: `@if (control().touched && control().invalid) {
    <small class="field-error" [id]="id()" role="alert">{{ message() }}</small>
  }`,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();
  /** Id do campo descrito; o appField do campo aponta para esta mensagem. */
  readonly field = input.required<string>();
  readonly message = input('Preencha este campo corretamente.');
  readonly id = computed(() => errorId(this.field()));
}
