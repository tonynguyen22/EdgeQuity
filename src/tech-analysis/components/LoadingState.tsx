export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-48 space-y-4">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 animate-pulse">Fetching price data & computing indicators…</p>
    </div>
  );
}
