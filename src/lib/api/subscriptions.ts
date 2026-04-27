import { apiRequest } from "./client";
import {
  PromoListParams,
  type CreateSubscriptionPayload,
  type CreateSubscriptionResponse,
  type PlanDetail,
  type PlanListParams,
  type PlanListResponse,
  type PlanPayload,
  type PlanPayloadUpdate,
  type SubscriptionListParams,
  type SubscriptionListResponse,
  PromotionPayload,
  PromotionItem,
  PromotionPayloadUpdate
} from "@/types/api/subscriptions";

export const plansApi = {
  list: (params: PlanListParams) => apiRequest<PlanListResponse>("/plans", { params }),

  detail: (id: string) =>
    apiRequest<PlanDetail>(`/plans/${id}`),

  getById: (id: string) =>
    apiRequest<PlanDetail>(`/plans/${id}`),

  create: (payload: PlanPayload) =>
    apiRequest<{ id: string }>("/plans", { method: "POST", body: payload }),

  update: (id: string, payload: PlanPayloadUpdate) =>
    apiRequest<{ id: string }>(`/plans/${id}`, { method: "PUT", body: payload }),

  delete: (id: string) =>
    apiRequest<void>(`/plans/${id}`, { method: "DELETE" }),
};

export const subscriptionsApi = {
  list: (params: SubscriptionListParams) =>
    apiRequest<SubscriptionListResponse>("/subscriptions", { params }),

  create: (payload: CreateSubscriptionPayload) =>
    apiRequest<CreateSubscriptionResponse>("/subscriptions", { method: "POST", body: payload }),
};

export const promosApi = {
  list: (params: PromoListParams) =>
    apiRequest<PromotionItem[]>("/promotions", { params }),

  create: (payload: PromotionPayload) =>
    apiRequest<void>("/promotions", { method: "POST", body: payload }),

  getById: (id: string, signal?: AbortSignal) =>
    apiRequest<PromotionItem>(`/promotions/${id}`, { signal }),

  update: (id: string, payload: PromotionPayloadUpdate, signal?: AbortSignal) =>
    apiRequest<void>(`/promotions/${id}`, { method: "PUT", body: payload, signal }),

  delete: (id: string, signal?: AbortSignal) =>
    apiRequest<void>(`/promotions/${id}`, { method: "DELETE", signal }),

};
