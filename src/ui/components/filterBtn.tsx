// ui/components/filterBtn.tsx
type Option<T extends string> = { label: string; value: T };
type Props<T extends string> = { 
  title: string; 
  options: Option<T>[]; 
  onSelect?: (value: T) => void; 
  selected?: T 
};

const FilterBtn = <T extends string>({ title, options, onSelect, selected }: Props<T>) => {
  return (
    <details className="dropdown bg-neutral">
      <summary className="btn m-1 bg-neutral">
        {title}
        <svg className="fill-current ml-1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
      </summary>
      <ul className="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
        {options.map((item) => (
          <li key={item.value}>
            <button
              type="button"
              className={selected === item.value ? "active" : ""}
              onClick={() => onSelect?.(item.value)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
};

export default FilterBtn;