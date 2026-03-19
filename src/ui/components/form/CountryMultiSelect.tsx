import { useMemo,useState } from "react";

export function CountryMultiSelect({
  availableCountries,
  value,
  onChange,
}: {
  availableCountries: { code: string; name: string; flag: string }[];
  value: string[];
  onChange: (codes: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const showList = search.trim().length > 0;
  const toggle = (code: string) => {
    if (value.includes(code)) {
      onChange(value.filter((c) => c !== code));
    } else {
      onChange([...value, code]);
    }
  };
  const filtered = useMemo(
    () =>
      availableCountries.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [availableCountries, search],
  );

  return (
    <div className="space-y-2">
      <input
        className="input input-bordered w-full bg-base-200 border-base-300"
        placeholder="Rechercher un pays"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {showList && (
        <div className="max-h-48 overflow-y-auto space-y-1 border border-base-300 rounded-lg p-2 bg-base-200/60">
          {filtered.map((country) => {
            const selected = value.includes(country.code);
            return (
              <label key={country.code} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={selected}
                  onChange={() => toggle(country.code)}
                />
                <span className="text-lg">{country.flag}</span>
                <span className="text-white/80">{country.name}</span>
              </label>
            );
          })}
          {filtered.length === 0 && <div className="text-xs text-white/60">Aucun pays trouvé</div>}
        </div>
      )}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((code) => {
            const country = availableCountries.find((c) => c.code === code);
            return (
              <span
                key={code}
                className="badge badge-outline border-primary/40 text-primary gap-2"
                title={country?.name || code}
              >
                {country?.flag} {code}
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-primary"
                  onClick={() => toggle(code)}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}