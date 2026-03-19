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
  return (
    <label
      htmlFor={id}
      className="flex flex-col justify-center border-2 border-dashed border-base-300 rounded-xl bg-base-100/5 min-h-[140px] cursor-pointer px-4 py-6 text-center text-white/80"
    >
      <span className="text-4xl mb-2">🎬</span>
      <span className="text-sm mb-2">{label}</span>
      <span className="text-xs text-white/60">{file ? file.name : fileLabel}</span>
      <input
        id={id}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
      {file && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            className="btn btn-outline btn-primary btn-xs"
            onClick={(e) => {
                e.preventDefault(); // Ajout important pour ne pas ouvrir le sélecteur de fichier
                const url = URL.createObjectURL(file);
                onPreview(url);
            }}
          >
            Prévisualiser
          </button>
        </div>
      )}
    </label>
  );
}
