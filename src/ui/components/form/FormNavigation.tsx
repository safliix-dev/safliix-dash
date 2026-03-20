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
}

export function FormNavigation({
  currentStep,
  _totalSteps,
  onPrevious,
  isSubmitting = false,
  isLastStep = false,
  nextLabel = "Continuer",
  finalLabel = "Publier"
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
      
      <button
        type="submit"
        className={`btn btn-primary ${currentStep === 0 ? 'ml-auto' : ''}`}
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
  );
}