// Alias kept for backward compatibility with older callers.
// Identical shape to IVerifyOtpPayload.
export interface IOtpVerifyPayload {
  email: string
  otpCode: string
}
