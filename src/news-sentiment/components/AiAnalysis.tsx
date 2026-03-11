import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface AiAnalysisProps {
  aiLoading: boolean;
  aiAnalysis: string | null;
  aiError: string;
}

export default function AiAnalysis({ aiLoading, aiAnalysis, aiError }: AiAnalysisProps) {
  if (!aiLoading && !aiAnalysis && !aiError) return null;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-sky-400" />
        <h3 className="text-sm font-semibold text-slate-300">AI News Analysis</h3>
      </div>
      {aiLoading && (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
          <span className="text-slate-400 text-sm">Analyzing headlines...</span>
        </div>
      )}
      {aiError && <p className="text-red-400 text-sm">{aiError}</p>}
      {aiAnalysis && !aiLoading && (
        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{aiAnalysis}</div>
      )}
    </div>
  );
}
