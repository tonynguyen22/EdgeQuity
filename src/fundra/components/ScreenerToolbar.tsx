import type { ChangeEvent } from 'react';

interface ScreenerToolbarProps {
  query: string;
  sector: string;
  sectors: string[];
  onQueryChange: (query: string) => void;
  onSectorChange: (sector: string) => void;
  onReset: () => void;
}

export default function ScreenerToolbar({
  query,
  sector,
  sectors,
  onQueryChange,
  onSectorChange,
  onReset,
}: ScreenerToolbarProps) {
  const inputStyle = {
    background: 'var(--vw-bg-base)',
    borderColor: 'var(--vw-border-lit)',
    color: 'var(--vw-text-primary)',
  };

  return (
    <div
      className="flex flex-col gap-2 border-b px-3 py-3 sm:flex-row sm:items-center"
      style={{ borderColor: 'var(--vw-border)' }}
    >
      <input
        type="search"
        value={query}
        placeholder="Search ticker or company"
        onChange={(event: ChangeEvent<HTMLInputElement>) => onQueryChange(event.target.value)}
        className="h-9 min-w-0 flex-1 rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-[var(--vw-text-muted)] focus:border-[var(--vw-accent)]"
        style={inputStyle}
      />
      <div className="flex gap-2">
        <select
          value={sector}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onSectorChange(event.target.value)}
          className="h-9 w-full min-w-[160px] rounded-md border px-2 text-sm outline-none transition-colors focus:border-[var(--vw-accent)] sm:w-[210px]"
          style={inputStyle}
        >
          <option value="">All sectors</option>
          {sectors.map((sectorOption) => (
            <option key={sectorOption} value={sectorOption}>
              {sectorOption}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onReset}
          className="h-9 rounded-md border px-3 text-xs font-semibold uppercase transition-colors hover:bg-[var(--vw-bg-hover)]"
          style={{ borderColor: 'var(--vw-border-lit)', color: 'var(--vw-text-secondary)' }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
