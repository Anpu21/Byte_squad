/** Result of a successful manager step-up authorization for an over-limit charge. */
export interface CreditOverrideAuthorization {
  token: string;
  authorizedBy: string;
  expiresInSeconds: number;
}
