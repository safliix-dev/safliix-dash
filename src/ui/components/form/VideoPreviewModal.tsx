// ui/components/form/VideoPreviewModal.tsx
'use client';

import React from "react";

export interface VideoPreviewModalProps {
  url: string;
  onClose: () => void;
}

export function VideoPreviewModal({ url, onClose }: VideoPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-neutral rounded-2xl border border-base-300 p-4 max-w-4xl w-full shadow-lg space-y-3 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Prévisualisation vidéo</h3>
          <button
            className="btn btn-ghost btn-sm text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
          <video 
            src={url} 
            controls 
            className="max-w-full max-h-[70vh]" 
          />
        </div>
      </div>
    </div>
  );
}