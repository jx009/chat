import { apiRequest } from "./api-client";
import { MembershipInfo } from "@/types/membership";

export function getMembershipInfo(accessToken: string) {
  return apiRequest<MembershipInfo>("/memberships/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

