import type { Timeframe, Signal } from '../types';
import { signalColor } from '../utils/formatters';

interface TimeframeToggleProps {
  active: Timeframe;
  onChange: (tf: Timeframe) => void;
  dailySignal: Signal | null;
  weeklySignal: Signal | null;
}

export default function TimeframeToggle({ active, onChange, dailySignal, weeklySignal }: TimeframeToggleProps) {
  const tabs: { tf: Timeframe; label: string; sub: string; signal: Signal | null }[] = [
    { tf: 'D1', label: 'Daily', sub: '1D', signal: dailySignal },
    { tf: 'W1', label: 'Weekly', sub: '1W', signal: weeklySignal },
  ];

  return (
    <div className="flex items-center gap-2">
      {tabs.map(({ tf, label, sub, signal }) => {
        const isActive = active === tf;
        const sc = signal ? signalColor(signal.label) : null;
        return (
          <button
            key={tf}
            onClick={() => onChange(tf)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-violet-500/15 border border-violet-500/40 text-violet-300'
                : 'bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-slate-300 hover:border-slate-600/60'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isActive ? 'bg-violet-500/25 text-violet-300' : 'bg-slate-700/50 text-slate-500'}`}>
                {sub}
              </span>
              <span>{label}</span>
            </span>
            {signal && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${sc?.text} ${sc?.bg} ${sc?.border} border`}>
                {signal.score}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
