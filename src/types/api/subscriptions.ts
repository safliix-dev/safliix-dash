import { type PaginatedResponse } from "./common";


export type PlanForm = {
  name: string;
  price: number;
  yearlyDiscount: number; // %
  currency: "XOF" | "EUR" | "USD";
  maxSharedAccounts: number;
  quality: string;
  description: string;
};

export interface SubscriptionListParams {
  page: number;
  pageSize: number;
  filter?: string;
}

export interface SubscriptionItem {
  id: string;
  userId: string;
  planId: string;
  paymentMethod: string;
  startDate?: string;
  status?: string;
  total?: number;
  currency?: string;
  userName?: string;
  country?: string;
}

export type SubscriptionListResponse = PaginatedResponse<SubscriptionItem>;

export interface PlanListParams {
  page: number;
  pageSize: number;
}

export interface PlanItem {
  id: string;
  name: string;
  price: number;
  status?: string;
  maxSharedAccounts: number;
  videoQuality?: string;
  currency: string;
  description:string;
  yearlyDiscount: number;
}

export type PlanListResponse = PaginatedResponse<PlanItem>;

export type PlanDetail = PlanItem;

export interface PlanPayload {
  name: string;
  price: number;
  yearlyDiscount: number;
  status: string;
  maxSharedAccounts: number;
  quality?: string;
  currency?: string;
}

export type PlanPayloadUpdate = Partial<PlanPayload>;

export interface CreateSubscriptionPayload {
  userId: string;
  planId: string;
  paymentMethod: string;
  startDate?: string;
  promoCode?: string;
}

export interface CreateSubscriptionResponse { subscriptionId: string }


export interface PromotionPayload  {
  name: string;
  startDate: string;
  endDate: string;
  description?:string;
  isActive: boolean;
}

export interface PromotionItem extends PromotionPayload {
  id:string;
}

export type PromotionListResponse = PaginatedResponse<PromotionItem>;

export type PromotionPayloadUpdate = Partial<PromotionPayload>;
export interface PromoListParams {
  page: number;
  pageSize: number;
}