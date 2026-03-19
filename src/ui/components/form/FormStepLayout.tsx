// ui/components/form/FormStepLayout.tsx
'use client';

import React from "react";
import Header from "@/ui/components/header";

export interface FormStepLayoutProps {
  title: string;
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
}

export function FormStepLayout({
  title,
  currentStep,
  totalSteps,
  stepLabel,
  children,
  isLoading,
  error
}: FormStepLayoutProps) {
  return (
    <div className="space-y-4">
      <Header
        title={title}
        className="rounded-2xl border border-base-300 shadow-sm px-5"
      >
        <div className="text-sm text-white/80 flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-base-200/60 border border-base-300">
            Étape {currentStep + 1}/{totalSteps} • {stepLabel}
          </span>
        </div>
      </Header>

      {isLoading && (
        <div className="alert alert-info bg-base-200/60 border border-base-300">
          Chargement des données...
        </div>
      )}
      
      {error && (
        <div className="alert alert-error bg-red-900/40 border border-red-700">
          {error}
        </div>
      )}

      {children}
    </div>
  );
}