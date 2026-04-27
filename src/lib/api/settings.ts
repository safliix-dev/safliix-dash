import { apiRequest } from "./client";
import { type SettingsPayload, type SettingsResponse } from "@/types/api/settings";

export const settingsApi = {
  get: () => apiRequest<SettingsResponse>("/settings", {  }),
  update: (payload: SettingsPayload, ) =>
    apiRequest<SettingsResponse>("/settings", { method: "PUT", body: payload,  }),
};
