import { useEffect,useState } from "react";
import { SuggestionOption } from "@/types/form";


export function ActorsSelector({
  value,
  onChange,
  options,
}: {
  value: { actorId?: string; name: string }[];
  onChange: (val: { actorId?: string; name: string }[]) => void;
  options: SuggestionOption[]; // J'ai relaxé le type ici pour éviter les erreurs d'import manquants, tu peux remettre SuggestionOption si tu l'as exporté
}) {
  const [input, setInput] = useState("");
  const [actors, setActors] = useState<{ actorId?: string; name: string }[]>(value ?? []);

  useEffect(() => {
    setActors((value ?? []).filter((a) => a && a.name));
  }, [value]);

  const commit = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const existing = actors.find((a) => a.name.toLowerCase() === clean.toLowerCase());
    if (existing) {
      setInput("");
      return;
    }
    console.log('from actor selector');
    console.dir(options, {depth:2});
    const matched = options.find((opt) => opt.label.toLowerCase() === clean.toLowerCase());
    const actor = matched ? { name: matched.label, actorId: matched.value !== matched.label ? matched.value : undefined } : { name: clean };
    const next = [...actors, actor];
    setActors(next);
    onChange(next);
    setInput("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          list="actor-suggestions"
          className="input input-bordered w-full bg-base-200 border-base-300"
          placeholder="Saisir ou sélectionner un acteur"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(input);
            }
          }}
        />
        <button type="button" className="btn btn-primary btn-sm" onClick={() => commit(input)}>
          Ajouter
        </button>
        <datalist id="actor-suggestions">
          {options.map((opt,index) => (
            <option key={index} value={opt.label} />
          ))}
        </datalist>
      </div>
      {actors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actors.map((actor,index) => (
            <span key={index}	 className="badge badge-outline border-primary/50 text-primary gap-2">
              {actor.name}
              <button
                type="button"
                className="btn btn-ghost btn-xs text-primary"
                onClick={() => {
                  const next = actors.filter((a) => (a.actorId ?? a.name) !== (actor.actorId ?? actor.name));
                  setActors(next);
                  onChange(next);
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}