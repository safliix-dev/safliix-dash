// types/api/tokens.ts
export interface TokensSaveResponse {
  success: boolean;
  sessionId: string;
  expiresAt: string;
}

export interface TokensGetResponse {
  exists: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  isExpired?: boolean;
  message?: string;
}

export interface TokensRefreshResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}