import { FormControl, FormGroup } from '@angular/forms';
import { minutesValidator, nonBlank, passwordMatch, passwordValidators } from './validators';
describe('Validações dos formulários', () => {
  it.each([null, 0, -1, 1441, 1.5, '30', NaN])('rejeita minutos inválidos: %s', (value) => {
    expect(new FormControl(value, minutesValidator).invalid).toBe(true);
  });
  it.each([1, 30, 1440])('aceita minutos válidos: %s', (value) => {
    expect(new FormControl(value, minutesValidator).valid).toBe(true);
  });
  it.each(['', '  ', 'a', ' a '])('rejeita nome vazio ou curto: %s', (value) => {
    expect(new FormControl(value, nonBlank).invalid).toBe(true);
  });
  it('aceita senha longa conforme backend e rejeita senha sem os requisitos', () => {
    expect(new FormControl('SenhaMuitoMaiorQueOito1!', passwordValidators).valid).toBe(true);
    expect(new FormControl('Ab1!', passwordValidators).valid).toBe(true);
    for (const value of [
      'abc',
      'Senha123',
      'senha123!',
      'SENHA123!',
      'Senha!!!',
      `Ab1!${'a'.repeat(125)}`,
    ])
      expect(new FormControl(value, passwordValidators).invalid).toBe(true);
  });
  it('valida a confirmação de senha', () => {
    const form = new FormGroup(
      { new_password: new FormControl('Ab1!'), confirmation: new FormControl('Ab2!') },
      passwordMatch,
    );
    expect(form.hasError('passwordMatch')).toBe(true);
    form.controls.confirmation.setValue('Ab1!');
    expect(form.valid).toBe(true);
  });
});
