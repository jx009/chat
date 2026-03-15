export type DurationType = "1_month" | "3_month";

export type MembershipPackage = {
  id: number;
  name: string;
  price: number;
  durationType: DurationType;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PackageInput = {
  name: string;
  price: number;
  durationType: DurationType;
  description?: string;
  isActive: boolean;
  sortOrder: number;
};

