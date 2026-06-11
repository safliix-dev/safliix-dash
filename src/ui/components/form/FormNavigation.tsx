// ui/components/form/FormNavigation.tsx
'use client';

import React from "react";

export interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious?: () => void;
  isSubmitting?: boolean;
  isLastStep?: boolean;
  nextLabel?: string;
  finalLabel?: string;
  skipAction?: { label: string; onClick: () => void };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function FormNavigation({ currentStep, totalSteps: _totalSteps, onPrevious,
  isSubmitting = false,
  isLastStep = false,
  nextLabel = "Continuer",
  finalLabel = "Publier",
  skipAction,
}: FormNavigationProps) {
  return (
    <div className="flex justify-between pt-4">
      {currentStep > 0 && onPrevious && (
        <button
          type="button"
          className="btn btn-ghost text-white"
          onClick={onPrevious}
          disabled={isSubmitting}
        >
          Précédent
        </button>
      )}

      <div className={`flex items-center gap-3 ${currentStep === 0 ? 'ml-auto' : ''}`}>
        {skipAction && (
          <button
            type="button"
            className="btn btn-ghost text-white/60 text-sm"
            onClick={skipAction.onClick}
            disabled={isSubmitting}
          >
            {skipAction.label}
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Traitement..."
            : isLastStep
              ? finalLabel
              : nextLabel
          }
        </button>
      </div>
    </div>
  );
}
