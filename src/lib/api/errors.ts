import { ApiError } from "./client";

export interface FriendlyError {
  message: string;
  status?: number;
  cause?: unknown;
}

export const formatApiError = (error: unknown): FriendlyError => {
  if (error instanceof ApiError) {
    const payloadMessage =
      (typeof error.data === "string" && error.data) ||
      (typeof error.data === "object" && error.data && "message" in error.data
        ? String((error.data as { message?: unknown }).message)
        : null);

    const baseMessage =
      payloadMessage ||
      (error.status >= 500
        ? "Le service est indisponible, réessayez plus tard."
        : "Une erreur est survenue.");

    return {
      message:
        error.status === 403
          ? "Accès refusé pour cette action."
          : baseMessage,
      status: error.status,
      cause: error.data,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Une erreur inattendue est survenue." };
};
