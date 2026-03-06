import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerHeaderProps {
  displayName: string;
  close: number;
  yearChange: number | null;
}

export default function TickerHeader({ displayName, close, yearChange }: TickerHeaderProps) {
  return (
    <div className="flex items-baseline gap-4 flex-wrap">
      <h2 className="text-2xl font-bold text-white">{displayName}</h2>
      <span className="text-xl font-semibold text-slate-200">${close.toFixed(2)}</span>
      {yearChange !== null && (
        <span className={`text-sm font-medium flex items-center gap-1 ${yearChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {yearChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {yearChange >= 0 ? '+' : ''}{yearChange.toFixed(2)}% (1 yr)
        </span>
      )}
    </div>
  );
}
