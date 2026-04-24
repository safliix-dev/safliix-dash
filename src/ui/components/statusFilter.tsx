// ui/components/StatusFilter.tsx
'use client';

import type { StatusFilterOption } from "@/lib/hooks/useBaseContentManagement";

interface StatusFilterProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  options: StatusFilterOption[];
  className?: string;
}

export function StatusFilter({ selectedStatus, onStatusChange, options, className = "" }: StatusFilterProps) {
  const getSelectedLabel = () => {
    const option = options.find(opt => opt.value === selectedStatus);
    return option?.label || "Statut";
  };

  return (
    <div className={`dropdown dropdown-bottom ${className}`}>
      <label tabIndex={0} className="btn btn-outline btn-sm rounded-full gap-2">
        {getSelectedLabel()}
        {selectedStatus !== "all" && (
          <span className="badge badge-primary badge-sm">
            {options.find(opt => opt.value === selectedStatus)?.count}
          </span>
        )}
        <span className="text-xs opacity-70">▼</span>
      </label>
      <div tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52 border border-base-300">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={`
              flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm
              ${selectedStatus === option.value 
                ? 'bg-primary text-primary-content' 
                : 'hover:bg-base-300'
              }
            `}
          >
            <span>{option.label}</span>
            <span className={`
              badge badge-sm
              ${selectedStatus === option.value 
                ? 'badge-primary' 
                : 'badge-ghost'
              }
            `}>
              {option.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}