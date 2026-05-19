'use client';
import { useRef } from "react";

export function VideoUpload({
  id,
  label,
  fileLabel,
  file,
  onSelect,
  onPreview,
}: {
  id: string;
  label: string;
  fileLabel: string;
  file: File | null;
  onSelect: (file?: File | null) => void;
  onPreview: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex flex-col justify-center border-2 border-dashed border-base-300 rounded-xl bg-base-100/5 min-h-[140px] cursor-pointer px-4 py-6 text-center text-white/80"
      onClick={() => inputRef.current?.click()}
    >
      <span className="text-4xl mb-2">🎬</span>
      <span className="text-sm mb-2">{label}</span>

      {file ? (
        <div className="tooltip tooltip-bottom mx-auto max-w-[200px]" data-tip={file.name}>
          <span className="text-xs text-white/60 truncate block max-w-[200px]">{file.name}</span>
        </div>
      ) : (
        <span className="text-xs text-white/60">{fileLabel}</span>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="video/*"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />

      {file && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            className="btn btn-outline btn-primary btn-xs"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(URL.createObjectURL(file));
            }}
          >
            Prévisualiser
          </button>
        </div>
      )}
    </div>
  );
}
