import { Injectable } from '@nestjs/common';

/**
 * MultiTenderCalculatorService — Shanel multi-tender split math.
 *
 * Stub registered in Phase 2 so `pos.module.ts` compiles and downstream
 * phases can inject it without further module churn. The actual
 * calculation rules (cash change derivation, partial-payment + keep-balance
 * routing, credit-amount running totals) land in Phase 5 alongside the
 * `POST /pos/sales` write endpoint.
 *
 * // PHASE-5: implement
 */
@Injectable()
export class MultiTenderCalculatorService {}
