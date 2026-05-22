export interface IPayhereCheckoutPayload {
  provider: 'payhere'
  actionUrl: string
  fields: Record<string, string>
}
