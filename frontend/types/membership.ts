export type MembershipInfo = {
  status: "none" | "active" | "expired";
  startAt: string | null;
  expireAt: string | null;
  isChatAllowed: boolean;
};

