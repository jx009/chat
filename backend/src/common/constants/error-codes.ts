export const ERROR_CODES = {
  badRequest: 40000,
  usernameExists: 40001,
  passwordMismatch: 40002,
  invalidCredentials: 40003,
  unauthorized: 40004,
  forbidden: 40005,
  membershipRequired: 40006,
  packageUnavailable: 40007,
  modelUnavailable: 40008,
  conversationNotFound: 40009,
  serverError: 50000,
  paymentCreateFailed: 50001,
  paymentSignatureInvalid: 50002,
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
