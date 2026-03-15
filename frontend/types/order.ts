export type PaymentOrder = {
  id: number;
  orderNo: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "closed";
  thirdPartyOrderNo?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePaymentOrderResult = PaymentOrder & {
  payParams: {
    payUrl: string;
    formHtml: string;
  };
};

