// ui/components/StatusBadge.tsx
'use client';

import { STATUS_CONFIG } from "@/lib/hooks/useBaseContentManagement";
import type { ContentStatus } from "@/types/api/common";

interface StatusBadgeProps {
  status: ContentStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "badge-sm",
  md: "badge-md",
  lg: "badge-lg",
};

export function StatusBadge({ status, size = "sm", className = "" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  
  return (
    <span className={`badge ${sizeClasses[size]} ${config.color} text-white border-0 ${className}`}>
      {config.label}
    </span>
  );
}