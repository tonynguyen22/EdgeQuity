import { useState, useRef, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';
import type { HoverInfo } from '../types';

interface IndicatorHoverCardProps {
  hoverInfo: HoverInfo;
}

export default function IndicatorHoverCard({ hoverInfo }: IndicatorHoverCardProps) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setAbove(rect.top > 280);
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <span className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        className="text-slate-500 hover:text-violet-400 transition-colors focus:outline-none focus:text-violet-400"
        onMouseEnter={() => { setOpen(true); reposition(); }}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(prev => !prev)}
        aria-label="Indicator info"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          ref={cardRef}
          className={`absolute z-50 w-72 sm:w-80 ${above ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600/60 rounded-xl shadow-xl shadow-black/40 p-4 space-y-3`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-violet-400 uppercase tracking-wide">What is this?</p>
            <p className="text-xs text-slate-300 leading-relaxed">{hoverInfo.what}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-violet-400 uppercase tracking-wide">Current Reading</p>
            <p className="text-xs text-slate-300 leading-relaxed">{hoverInfo.reading}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-violet-400 uppercase tracking-wide">How to Use It</p>
            <p className="text-xs text-slate-300 leading-relaxed">{hoverInfo.howTo}</p>
          </div>
          <div className={`absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-800 border-slate-600/60 rotate-45 ${above ? 'top-full -mt-1.5 border-r border-b' : 'bottom-full -mb-1.5 border-l border-t'}`} />
        </div>
      )}
    </span>
  );
}
