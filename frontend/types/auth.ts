export type UserRole = "user" | "admin";
export type MembershipStatus = "none" | "active" | "expired";

export type CurrentUser = {
  id: number;
  username: string;
  role: UserRole;
  membershipStatus: MembershipStatus;
  membershipExpireAt?: string | null;
};

export type RegisterInput = {
  username: string;
  password: string;
  confirmPassword: string;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type RefreshTokenInput = {
  refreshToken: string;
};

export type RegisterResult = {
  userId: number;
};

export type CheckUsernameResult = {
  available: boolean;
};

export type SuggestUsernameResult = {
  username: string;
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: CurrentUser;
};
