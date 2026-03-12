import React from 'react';
import { Sparkles, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

interface AiAnalysisProps {
  aiLoading: boolean;
  aiAnalysis: string | null;
  aiError: string;
  onRun: () => void;
}

function renderLines(text: string) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // Bullet points: "- [date] summary"
    if (trimmed.startsWith('- ')) {
      return (
        <div key={i} className="flex gap-2 mt-2">
          <span className="text-sky-500 shrink-0 mt-0.5">•</span>
          <span className="text-sm text-slate-300 leading-relaxed">{trimmed.slice(2)}</span>
        </div>
      );
    }

    // "Bottom Line:" paragraph
    if (trimmed.toLowerCase().startsWith('bottom line:')) {
      return (
        <div key={i} className="mt-3 pt-3 border-t border-slate-700/40">
          <p className="text-sm text-slate-200 leading-relaxed">
            <span className="font-semibold text-sky-400">Bottom Line: </span>
            {trimmed.slice(12).trim()}
          </p>
        </div>
      );
    }

    return <p key={i} className={`text-sm text-slate-300 leading-relaxed ${i > 0 ? 'mt-1.5' : ''}`}>{trimmed}</p>;
  });
}

export default function AiAnalysis({ aiLoading, aiAnalysis, aiError, onRun }: AiAnalysisProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-3">
      {/* Header + Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-300">AI News Analysis</h3>
        </div>
        <button
          onClick={onRun}
          disabled={aiLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : aiAnalysis ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          {aiLoading ? 'Analyzing...' : aiAnalysis ? 'Re-analyze' : 'Run AI Analysis'}
        </button>
      </div>

      {/* Empty state */}
      {!aiAnalysis && !aiLoading && !aiError && (
        <p className="text-sm text-slate-300 leading-relaxed">
          Scans all articles from the last 7 days and highlights anything important that could affect your position.
        </p>
      )}

      {/* Loading */}
      {aiLoading && (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
          <span className="text-slate-400 text-sm">Reading articles...</span>
        </div>
      )}

      {/* Error */}
      {aiError && (
        <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-300 text-sm">{aiError}</p>
        </div>
      )}

      {/* Result */}
      {aiAnalysis && !aiLoading && (
        <div>
          {renderLines(aiAnalysis)}
          <p className="text-[10px] text-slate-600 mt-3 pt-2 border-t border-slate-700/30">
            AI analysis is for informational purposes only and should not be considered financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
