import { apiRequest } from "./api-client";
import { PaymentConfig, PaymentConfigInput } from "@/types/payment";

export function getPaymentConfig(accessToken: string) {
  return apiRequest<PaymentConfig>("/admin/payment-config", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function updatePaymentConfig(
  accessToken: string,
  input: PaymentConfigInput,
) {
  return apiRequest<PaymentConfig>("/admin/payment-config", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

