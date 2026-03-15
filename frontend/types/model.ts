export type AvailableModel = {
  id: number;
  name: string;
  code: string;
};

export type AdminModel = {
  id: number;
  name: string;
  code: string;
  apiUrl: string;
  apiKey: string;
  isActive: boolean;
  sortOrder: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
};

export type ModelInput = {
  name: string;
  code: string;
  apiUrl: string;
  apiKey?: string;
  isActive: boolean;
  sortOrder: number;
  remark?: string;
};

