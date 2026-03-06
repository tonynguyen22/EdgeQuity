import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onClearCache: () => void;
}

export default function ErrorState({ error, onClearCache }: ErrorStateProps) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex items-start gap-3 max-w-xl mx-auto">
      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-red-400 font-medium">Error loading data</p>
        <p className="text-red-400/80 text-sm mt-0.5">{error}</p>
        <button onClick={onClearCache} className="mt-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors">Clear Cache & Retry</button>
      </div>
    </div>
  );
}
