// types/api/tokens.ts
export interface TokensSaveResponse {
  success: boolean;
  sessionId: string;
  expiresAt: string;
}

export interface TokensGetResponse {
  exists: boolean;
  refreshToken?: string;
  expiresAt?: string;
  isExpired?: boolean;
  message?: string;
}

export interface TokensRefreshResponse {
  success: boolean;
  refreshToken: string;
  expiresIn: number;
}