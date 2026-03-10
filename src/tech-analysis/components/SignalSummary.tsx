import type { Signal, Timeframe } from '../types';
import { signalColor, signalBarGradient } from '../utils/formatters';

interface SignalSummaryProps {
  dailySignal: Signal;
  weeklySignal: Signal | null;
  activeTimeframe: Timeframe;
}

function SignalBadge({ signal, label }: { signal: Signal; label: string }) {
  const sc = signalColor(signal.label);
  return (
    <div className={`rounded-xl p-4 border flex-1 min-w-[240px] ${sc.bg} ${sc.border}`}>
      <div className="flex items-center gap-3">
        <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 ${sc.ring} ${sc.text}`}>
          <span className="text-lg font-bold leading-none">{signal.score}</span>
          <span className="text-[9px] text-slate-500 mt-0.5">/ 100</span>
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
          </div>
          <p className={`text-lg font-bold ${sc.text}`}>{signal.label}</p>
          {/* Score bar */}
          <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${signalBarGradient(signal.score)} transition-all duration-500`}
              style={{ width: `${signal.score}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignalSummary({ dailySignal, weeklySignal, activeTimeframe }: SignalSummaryProps) {
  const activeSignal = activeTimeframe === 'W1' && weeklySignal ? weeklySignal : dailySignal;

  return (
    <div className="space-y-4">
      {/* Dual-timeframe badges */}
      <div className="flex flex-wrap gap-3">
        <SignalBadge signal={dailySignal} label="Daily Signal" />
        {weeklySignal && <SignalBadge signal={weeklySignal} label="Weekly Signal" />}
      </div>

      {/* Active timeframe detail pills */}
      {activeSignal.details.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeSignal.details.map((d, i) => (
            <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border ${
              d.bull === true  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
              d.bull === false ? 'bg-red-500/10 border-red-500/20 text-red-300' :
              'bg-slate-700/50 border-slate-600/50 text-slate-300'
            }`}>
              <span className="text-slate-400 text-xs">{d.name}:</span>
              <span className="font-medium">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
