import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
export const passwordValidators = [
  Validators.required,
  Validators.minLength(4),
  Validators.maxLength(128),
  Validators.pattern(
    /^(?=[\s\S]*[a-z])(?=[\s\S]*[A-Z])(?=[\s\S]*[0-9])(?=[\s\S]*[^a-zA-Z0-9])[\s\S]+$/,
  ),
];
export const minutesValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  Number.isInteger(control.value) && control.value >= 1 && control.value <= 1440
    ? null
    : { minutes: true };
export const nonBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim().length >= 2 ? null : { nonBlank: true };
export const passwordMatch: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.get('new_password')?.value === control.get('confirmation')?.value
    ? null
    : { passwordMatch: true };
