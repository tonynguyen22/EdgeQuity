import { Signal } from '../types';

interface SignalSummaryProps {
  signal: Signal;
}

export default function SignalSummary({ signal }: SignalSummaryProps) {
  return (
    <div className={`rounded-xl p-4 border ${
      signal.label === 'Bullish' ? 'bg-emerald-500/5 border-emerald-500/20' :
      signal.label === 'Bearish' ? 'bg-red-500/5 border-red-500/20' :
      'bg-slate-800/50 border-slate-700/50'
    }`}>
      <div className="flex items-center flex-wrap gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 ${
            signal.label === 'Bullish' ? 'border-emerald-500 text-emerald-400' :
            signal.label === 'Bearish' ? 'border-red-500 text-red-400' :
            'border-amber-500 text-amber-400'
          }`}>
            <span className="text-lg font-bold leading-none">{signal.score}</span>
            <span className="text-[9px] text-slate-500 mt-0.5">/ 100</span>
          </div>
          <div>
            <p className={`text-lg font-bold ${
              signal.label === 'Bullish' ? 'text-emerald-400' :
              signal.label === 'Bearish' ? 'text-red-400' : 'text-amber-400'
            }`}>{signal.label}</p>
            <p className="text-xs text-slate-500">Technical Signal</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {signal.details.map((d, i) => (
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
      </div>
    </div>
  );
}
