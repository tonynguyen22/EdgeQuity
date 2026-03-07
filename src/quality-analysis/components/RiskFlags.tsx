import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  flags: string[];
}

export default function RiskFlags({ flags }: Props) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-300">Risk Flags</h3>
        {flags.length > 0 && (
          <span className="ml-auto text-xs bg-red-500/15 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">
            {flags.length} {flags.length === 1 ? 'flag' : 'flags'}
          </span>
        )}
      </div>
      {flags.length === 0 ? (
        <p className="text-sm text-emerald-400">No significant risk flags identified.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {flags.map(flag => (
            <span key={flag} className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-300 border border-red-500/25 rounded-full px-3 py-1 text-xs font-medium">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              {flag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
