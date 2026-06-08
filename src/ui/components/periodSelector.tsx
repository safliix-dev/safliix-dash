'use client';

export type PeriodValue = { start: string; end: string }; // ISO strings YYYY-MM-DD

interface PeriodSelectorProps {
  value: PeriodValue;
  onChange: (period: PeriodValue) => void;
}

export function isoToFR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function defaultPeriod(): PeriodValue {
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start: fmt(start), end: fmt(end) };
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-white/60 whitespace-nowrap">Période :</span>
      <input
        type="date"
        value={value.start}
        max={value.end}
        onChange={(e) => onChange({ ...value, start: e.target.value })}
        className="input input-xs input-bordered rounded-lg bg-base-200 text-white"
      />
      <span className="text-white/40">→</span>
      <input
        type="date"
        value={value.end}
        min={value.start}
        onChange={(e) => onChange({ ...value, end: e.target.value })}
        className="input input-xs input-bordered rounded-lg bg-base-200 text-white"
      />
    </div>
  );
}
