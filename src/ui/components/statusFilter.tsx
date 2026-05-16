'use client';

import type { StatusFilterOption } from "@/lib/hooks/useBaseContentManagement";

interface StatusFilterProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  options: StatusFilterOption[];
  className?: string;
}

export function StatusFilter({ selectedStatus, onStatusChange, options, className = "" }: StatusFilterProps) {
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onStatusChange(option.value)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150
            ${selectedStatus === option.value
              ? 'bg-primary text-primary-content shadow-sm'
              : 'text-white/50 hover:text-white hover:bg-base-300'
            }`}
        >
          {option.label}
          <span className={`text-xs tabular-nums rounded-full px-1.5 py-0.5 leading-none
            ${selectedStatus === option.value
              ? 'bg-white/20 text-primary-content'
              : 'bg-base-300/80 text-white/40'
            }`}>
            {option.count}
          </span>
        </button>
      ))}
    </div>
  );
}
