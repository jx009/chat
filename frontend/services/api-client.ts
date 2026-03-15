import { useAuthStore } from "@/stores/auth-store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined>;
  skipAuthRedirect?: boolean;
};

export async function apiRequest<TData>(
  path: string,
  options: RequestOptions = {},
): Promise<TData> {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<TData> | null;

  if (!response.ok) {
    const error = new ApiError(
      payload?.message ?? `Request failed: ${response.status}`,
      payload?.code ?? response.status,
    );

    if (
      response.status === 401 &&
      !options.skipAuthRedirect &&
      typeof window !== "undefined"
    ) {
      useAuthStore.getState().clear();
      const redirect = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
    }

    throw error;
  }

  if (!payload) {
    throw new ApiError("Empty response");
  }

  return payload.data;
}
