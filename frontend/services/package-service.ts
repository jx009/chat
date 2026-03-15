import { apiRequest } from "./api-client";
import { MembershipPackage, PackageInput } from "@/types/package";

export function getPackages(accessToken: string) {
  return apiRequest<MembershipPackage[]>("/packages", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getAdminPackages(accessToken: string) {
  return apiRequest<MembershipPackage[]>("/admin/packages", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function createPackage(accessToken: string, input: PackageInput) {
  return apiRequest<MembershipPackage>("/admin/packages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export function updatePackage(
  accessToken: string,
  packageId: number,
  input: Partial<PackageInput>,
) {
  return apiRequest<MembershipPackage>(`/admin/packages/${packageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

