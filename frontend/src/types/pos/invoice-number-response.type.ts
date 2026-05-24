/**
 * Response payload from `GET /pos/invoice-number` — the next invoice
 * number the server will issue on the upcoming `POST /pos/sales`. Used by
 * the bill-template preview before the cashier confirms checkout.
 */
export interface IInvoiceNumberResponse {
  invoiceNo: string;
}
