import { UserRole } from "../constants/roles";

export type AuthenticatedUser = {
  userId: string;
  username: string;
  role: UserRole;
};

