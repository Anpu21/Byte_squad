import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Body for `POST /customers/:key/merge`. Folds the source (path `:key`, a
 * walk-in / khata stitched customer) into the registered customer identified by
 * `targetKey` (a customer key that must resolve to a registered user).
 */
export class MergeCustomerDto {
  @IsString()
  @IsNotEmpty()
  targetKey!: string;
}
