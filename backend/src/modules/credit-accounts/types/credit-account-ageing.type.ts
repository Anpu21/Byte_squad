/**
 * Outstanding credit bucketed by how far past its due date it is. `notDue`
 * is balance not yet due (or with no due date); the others are overdue bands.
 */
export interface CreditAccountAgeing {
  notDue: number;
  d1to30: number;
  d31to60: number;
  d61to90: number;
  d90plus: number;
  overdueTotal: number;
  outstandingTotal: number;
}
