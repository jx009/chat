export type PaymentConfig = {
  id: number;
  merchantId: string;
  appId: string;
  appKey: string;
  notifyUrl: string;
  gatewayUrl: string;
  signType: string;
  sandboxEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaymentConfigInput = {
  merchantId?: string;
  appId?: string;
  appKey?: string;
  notifyUrl?: string;
  gatewayUrl?: string;
  signType?: string;
  sandboxEnabled: boolean;
  isActive: boolean;
};

