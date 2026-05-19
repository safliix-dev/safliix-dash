'use client';
import { useEffect, useState } from "react";
import { ImageDownIcon } from "lucide-react";

type UploadBoxProps = {
  id?: string;
  label?: string;
  className?: string;
  value?: File | null;
  onFileSelect?: (file: File | null) => void;
};

export default function UploadBox({
  id = "main-upload",
  label = "Image",
  className = "",
  value,
  onFileSelect,
}: UploadBoxProps) {
  const [preview, setPreview] = useState<string | null>(null);

  // Controlled mode: sync preview with value prop
  useEffect(() => {
    if (value === undefined) return;
    if (!value) { setPreview(null); return; }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    // Uncontrolled mode: manage preview internally
    if (value === undefined) {
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return file ? URL.createObjectURL(file) : null;
      });
    }
    onFileSelect?.(file);
  };

  return (
    <label
      htmlFor={id}
      className={`cursor-pointer border-dashed border-1 border-gray rounded-lg px-4 py-6 flex flex-col items-center justify-center gap-4 transition hover:bg-white/10 ${className}`}
    >
      <input
        type="file"
        id={id}
        onChange={handleChange}
        className="hidden"
        accept="image/*"
      />
      {preview ? (
        <div className="relative w-full h-full min-h-[120px] rounded-md overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
          <span className="absolute bottom-2 right-2 text-sm bg-black/50 text-white px-2 py-1 rounded">
            Modifier
          </span>
        </div>
      ) : (
        <>
          <ImageDownIcon width={24} height={24} />
          <span className="text-white">{label}</span>
        </>
      )}
    </label>
  );
}
