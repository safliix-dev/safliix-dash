type Option<T extends string> = { label: string; value: T };
type Props<T extends string> = {
  title: string;
  options: Option<T>[];
  onSelect?: (value: T) => void;
  selected?: T;
};

const FilterBtn = <T extends string>({ title, options, onSelect, selected }: Props<T>) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/40 font-medium shrink-0">{title}</span>
      <div className="flex items-center bg-base-300/60 rounded-full p-0.5">
        {options.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect?.(item.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-150
              ${selected === item.value
                ? 'bg-primary text-primary-content shadow-sm'
                : 'text-white/50 hover:text-white'
              }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterBtn;
