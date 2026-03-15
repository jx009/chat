import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../constants/roles";
import { ROLES_KEY } from "../metadata/auth.metadata";

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

