import { apiRequest } from "./api-client";
import { AdminModel, AvailableModel, ModelInput } from "@/types/model";

export function getAvailableModels(accessToken: string) {
  return apiRequest<AvailableModel[]>("/models/available", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getAdminModels(accessToken: string) {
  return apiRequest<AdminModel[]>("/admin/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function createModel(accessToken: string, input: ModelInput) {
  return apiRequest<AdminModel>("/admin/models", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export function updateModel(
  accessToken: string,
  modelId: number,
  input: Partial<ModelInput>,
) {
  return apiRequest<AdminModel>(`/admin/models/${modelId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

