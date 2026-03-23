import { useRef, useState } from "react";
import { ImageDownIcon } from "lucide-react";
import Image from "next/image";

type UploadBoxProps = {
  id?: string;
  label?: string;
  className?: string;
  onFileSelect?: (file: File | null) => void;
};

export default function UploadBox({ id = "main-upload", label = "Image", className = "", onFileSelect }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
      onFileSelect?.(file);
    } else {
      setPreview(null);
      onFileSelect?.(null);
    }
  };

  return (
    <label
      htmlFor={id}
      className={`cursor-pointer border-dashed border-1 border-gray rounded-lg px-4 py-6 flex flex-col items-center justify-center gap-4 transition hover:bg-white/10 ${className}`}
    >
      <input
        type="file"
        id={id}
        ref={inputRef}
        onChange={handleChange}
        className="hidden"
        accept="image/*"
      />

      {preview ? (
        <div className="relative w-full h-24 rounded-md overflow-hidden">
          <Image
            width={360}
            height={360}
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
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
