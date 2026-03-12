import type { IndicatorCard } from '../types';
import { badgeCls, cardBorder, valueColor } from '../utils/formatters';
import IndicatorHoverCard from './IndicatorHoverCard';

interface IndicatorSectionsProps {
  cards: { section: string; cards: IndicatorCard[] }[];
}

export default function IndicatorSections({ cards }: IndicatorSectionsProps) {
  return (
    <>
      {cards.map(({ section, cards: sCards }) => (
        <div key={section} className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{section}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sCards.map((card) => (
              <div
                key={card.name}
                className={`bg-slate-800 border rounded-xl p-4 space-y-2 transition-colors relative z-1 ${cardBorder(card.bull)}`}
              >
                {/* Name + hover info + badge row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-slate-400 leading-tight">{card.name}</p>
                    <IndicatorHoverCard hoverInfo={card.hoverInfo} />
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap ${badgeCls(card.bull)}`}>
                    {card.label}
                  </span>
                </div>
                {/* Value */}
                <p className={`text-2xl font-bold tabular-nums ${valueColor(card.bull)}`}>{card.value}</p>
                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
