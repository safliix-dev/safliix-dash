'use client';

import React from "react";

export type DialogStatus = "idle" | "loading" | "success" | "error";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  status?: DialogStatus;
  resultMessage?: string | null;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
};

export default function ConfirmationDialog({
  open,
  title,
  message,
  status = "idle",
  resultMessage,
  confirmLabel = "Confirmer",
  confirmDisabled,
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  children,
}: ConfirmationDialogProps) {
  if (!open) return null;

  const isLoading = status === "loading";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-base-300 bg-neutral shadow-2xl p-6 space-y-4">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {message && <p className="text-sm text-white/70 mt-1">{message}</p>}
          </div>
          {!isLoading && (
            <button
              type="button"
              className="btn btn-ghost btn-sm text-white"
              onClick={onCancel}
              aria-label="Fermer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Contenu personnalisé - TOUJOURS affiché */}
        {children && (
          <div className={isLoading ? "opacity-100" : ""}>
            {children}
          </div>
        )}

        {/* Zone de chargement */}
        {isLoading && (
          <div className="flex items-center gap-3 text-sm text-white/80 py-2">
            <span className="loading loading-spinner loading-sm" />
            <span>Envoi en cours...</span>
          </div>
        )}

        {/* Messages de résultat et boutons (uniquement si pas en chargement) */}
        {!isLoading && (
          <>
            {status === "success" && resultMessage && (
              <div className="text-sm rounded-lg border border-green-600/60 bg-green-900/40 text-green-200 px-3 py-2">
                {resultMessage}
              </div>
            )}

            {status === "error" && resultMessage && (
              <div className="text-sm rounded-lg border border-red-600/60 bg-red-900/40 text-red-200 px-3 py-2">
                {resultMessage}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="btn btn-ghost rounded-full border-base-300"
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className="btn btn-primary rounded-full px-5"
                onClick={onConfirm}
                disabled={confirmDisabled}
              >
                {confirmLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}