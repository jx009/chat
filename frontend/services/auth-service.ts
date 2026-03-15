import { apiRequest } from "./api-client";
import {
  AuthResult,
  CheckUsernameResult,
  CurrentUser,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  RegisterResult,
  SuggestUsernameResult,
} from "@/types/auth";

export function checkUsername(username: string) {
  return apiRequest<CheckUsernameResult>("/auth/check-username", {
    method: "GET",
    query: { username },
  });
}

export function suggestUsername(username: string) {
  return apiRequest<SuggestUsernameResult>("/auth/suggest-username", {
    method: "GET",
    query: { username },
  });
}

export function register(input: RegisterInput) {
  return apiRequest<RegisterResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput) {
  return apiRequest<AuthResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function refreshToken(input: RefreshTokenInput) {
  return apiRequest<AuthResult>("/auth/refresh", {
    method: "POST",
    skipAuthRedirect: true,
    body: JSON.stringify(input),
  });
}

export function getCurrentUser(
  accessToken: string,
  options: { skipAuthRedirect?: boolean } = {},
) {
  return apiRequest<CurrentUser>("/users/me", {
    method: "GET",
    skipAuthRedirect: options.skipAuthRedirect,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
