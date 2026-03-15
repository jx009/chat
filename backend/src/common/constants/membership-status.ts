export const MEMBERSHIP_STATUSES = ["none", "active", "expired"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

