import React from 'react';
import { Search, Activity } from 'lucide-react';

interface SearchFormProps {
  tickerInput: string;
  setTickerInput: (value: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function SearchForm({ tickerInput, setTickerInput, loading, onSubmit }: SearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-3 max-w-xl mx-auto">
      <div className="relative flex-1">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={tickerInput}
          onChange={e => setTickerInput(e.target.value)}
          placeholder="Enter ticker (e.g. AAPL, MSFT, TSLA)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase transition-all"
        />
      </div>
      <button
        type="submit"
        disabled={!tickerInput.trim() || loading}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
      >
        <Activity className="w-4 h-4" />
        Analyze
      </button>
    </form>
  );
}
