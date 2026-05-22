import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { registerDecorator, ValidationOptions } from 'class-validator';
import { normalizeSriLankaPhone } from '../utils/phone.util';

const ERROR_MESSAGE =
  'Enter a Sri Lanka phone number (e.g. +94 77 123 4567 or 077 123 4567).';

export function IsSriLankaPhone(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) => {
      if (value === null || value === undefined || value === '') return value;
      const normalized = normalizeSriLankaPhone(value);
      return normalized ?? value;
    }),
    (target: object, propertyName: string | symbol) => {
      registerDecorator({
        name: 'isSriLankaPhone',
        target: target.constructor,
        propertyName: propertyName as string,
        options: { message: ERROR_MESSAGE, ...validationOptions },
        validator: {
          validate(value: unknown): boolean {
            return (
              typeof value === 'string' && /^\+94[1-9][0-9]{8}$/.test(value)
            );
          },
        },
      });
    },
  );
}
