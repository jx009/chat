import { apiRequest } from "./api-client";
import { CreatePaymentOrderResult, PaymentOrder } from "@/types/order";

export function createPaymentOrder(accessToken: string, packageId: number) {
  return apiRequest<CreatePaymentOrderResult>("/payments/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ packageId }),
  });
}

export function getPaymentOrder(accessToken: string, orderId: number) {
  return apiRequest<PaymentOrder>(`/payments/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
