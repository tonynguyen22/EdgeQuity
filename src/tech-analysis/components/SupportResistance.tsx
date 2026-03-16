import { Target, ArrowUp, TrendingDown } from 'lucide-react';
import type { SupportResistanceResult } from '../types';

interface SupportResistanceProps {
  data: SupportResistanceResult;
}

const SOURCE_BADGE: Record<string, string> = {
  pivot: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  fibonacci: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  sma: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  bollinger: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  swing: 'bg-slate-700/50 text-slate-400 border-slate-600/40',
};

const ZONE_THEME = [
  {
    card: 'bg-emerald-500/5 border-emerald-500/20',
    label: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    price: 'text-emerald-100',
    dist: 'text-emerald-400/70',
  },
  {
    card: 'bg-amber-500/5 border-amber-500/20',
    label: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    price: 'text-amber-100',
    dist: 'text-amber-400/70',
  },
  {
    card: 'bg-blue-500/5 border-blue-500/20',
    label: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    price: 'text-blue-100',
    dist: 'text-blue-400/70',
  },
];

export default function SupportResistance({ data }: SupportResistanceProps) {
  const { levels, entryZones, currentPrice } = data;

  const resistanceLevels = levels
    .filter(l => l.type === 'resistance')
    .sort((a, b) => a.price - b.price)
    .slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-violet-400" />
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Support & Resistance</h3>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed -mt-2">
        Analyzed using the weekly (W1) timeframe for more reliable levels suited for investing. Daily SMA and Bollinger Bands are included as supplementary reference.
      </p>

      {levels.length === 0 && (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
          <p className="text-xs text-slate-500">No significant support or resistance levels detected at this time.</p>
        </div>
      )}

      {levels.length > 0 && (
        <div className="space-y-4">

          {/* Entry Zones */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Entry Zones</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Price ranges where multiple technical levels converge — consider staging entries across zones if price pulls back.
            </p>

            {entryZones.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
                <p className="text-xs text-slate-500">No distinct entry zones identified within 30% below current price.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entryZones.map((zone, i) => {
                  const theme = ZONE_THEME[i] ?? ZONE_THEME[2];
                  const distFromTop = ((currentPrice - zone.high) / currentPrice) * 100;
                  const distFromBottom = ((currentPrice - zone.low) / currentPrice) * 100;
                  return (
                    <div key={i} className={`rounded-xl p-4 border space-y-2.5 ${theme.card}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${theme.label}`}>
                          {zone.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md border bg-slate-700/50 text-slate-400 border-slate-600/40">
                          {zone.strength} &middot; {zone.confluenceCount} level{zone.confluenceCount !== 1 ? 's' : ''} converge
                        </span>
                      </div>
                      <p className={`text-lg font-bold tabular-nums leading-none ${theme.price}`}>
                        ${zone.low.toFixed(2)} &ndash; ${zone.high.toFixed(2)}
                      </p>
                      <p className={`text-[11px] ${theme.dist}`}>
                        {distFromTop.toFixed(1)}%&ndash;{distFromBottom.toFixed(1)}% below current price
                      </p>
                      {zone.levels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {zone.levels.map((l, j) => (
                            <span key={j} className={`text-[10px] px-1.5 py-0.5 rounded border ${SOURCE_BADGE[l.source]}`}>
                              {l.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Key Resistance */}
          {resistanceLevels.length > 0 && (
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <ArrowUp className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Key Resistance</span>
              </div>
              <div className="space-y-1.5">
                {resistanceLevels.map((l, i) => {
                  const pct = ((l.price - currentPrice) / currentPrice * 100);
                  return (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${SOURCE_BADGE[l.source]}`}>
                          {l.source}
                        </span>
                        <span className="text-xs text-slate-400 truncate">{l.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold tabular-nums text-red-300">${l.price.toFixed(2)}</span>
                        <span className="text-[10px] text-red-400/70 tabular-nums w-14 text-right">+{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500 text-center">
            Current price: <span className="text-slate-400 font-medium tabular-nums">${currentPrice.toFixed(2)}</span> &middot; Percentages show distance from current price
          </p>
        </div>
      )}
    </div>
  );
}
