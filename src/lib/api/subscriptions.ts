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
  list: (params: PlanListParams, accessToken?: string) =>
    apiRequest<PlanListResponse>("/plans", { params, accessToken }),

  detail: (id: string, accessToken?: string, signal?: AbortSignal) =>
    apiRequest<PlanDetail>(`/plans/${id}`, { accessToken, signal }),

  getById: (id: string, accessToken?: string, signal?: AbortSignal) =>
    apiRequest<PlanDetail>(`/plans/${id}`, { accessToken, signal }),


  create: (payload: PlanPayload, accessToken?: string) =>
    apiRequest<{ id: string }>("/plans", { method: "POST", body: payload, accessToken }),

  update: (id: string, payload: PlanPayloadUpdate, accessToken?: string) =>
    apiRequest<{ id: string }>(`/plans/${id}`, { method: "PUT", body: payload, accessToken }),

  delete: (id: string, accessToken?: string) =>
    apiRequest<void>(`/plans/${id}`, { method: "DELETE", accessToken }),
};

export const subscriptionsApi = {
  list: (params: SubscriptionListParams, accessToken?: string) =>
    apiRequest<SubscriptionListResponse>("/subscriptions", { params, accessToken }),

  create: (payload: CreateSubscriptionPayload, accessToken?: string) =>
    apiRequest<CreateSubscriptionResponse>("/subscriptions", { method: "POST", body: payload, accessToken }),
};

export const promosApi = {
  list: (params: PromoListParams, accessToken?: string) =>
    apiRequest<PromotionItem[]>("/promotions", { params, accessToken }),

  create: (payload: PromotionPayload, accessToken?: string) =>
    apiRequest<void>("/promotions", { method: "POST", body: payload, accessToken }),

  getById: (id:string, accessToken?:string, signal?:AbortSignal) =>
    apiRequest<PromotionItem>(`/promotions/${id}`, {accessToken,signal}),

  update: (id:string, payload: PromotionPayloadUpdate, accessToken?:string, signal?:AbortSignal) =>
    apiRequest<void>(`/promotions/${id}`,{method:"PUT", body:payload, accessToken, signal } ),

  delete: (id:string, accessToken?:string, signal?:AbortSignal) =>
    apiRequest<void>(`/promotions/${id}`, { method:"DELETE", accessToken,signal}),

};
