import React from 'react';
import { ExternalLink } from 'lucide-react';
import { fmtTime } from '../utils/formatters';
import type { NewsArticle } from '../types';

interface NewsArticlesProps {
  articles: NewsArticle[];
  sym: string;
}

export default function NewsArticles({ articles, sym }: NewsArticlesProps) {
  if (articles.length === 0) {
    return <div className="text-center py-8 text-slate-500 text-sm">No news articles found for {sym} in the last 30 days.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-200">{sym} — Recent Headlines</h3>
        <span className="text-xs text-slate-500">{articles.length} articles, last 30 days</span>
      </div>
      <div className="space-y-2">
        {articles.map((article, i) => (
          <a
            key={i}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 hover:bg-slate-800/70 hover:border-slate-600/60 transition-all group"
          >
            <div className="flex items-start gap-3">
              {article.image && (
                <img
                  src={article.image}
                  alt=""
                  className="w-16 h-12 object-cover rounded-lg shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors leading-snug line-clamp-2">
                    {article.headline}
                  </p>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 mt-0.5 transition-colors" />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-slate-500">{article.source}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-xs text-slate-500">{fmtTime(article.datetime)}</span>
                  {article.category && article.category !== 'company news' && (
                    <>
                      <span className="text-slate-700">·</span>
                      <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded capitalize">{article.category}</span>
                    </>
                  )}
                </div>
                {article.summary && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{article.summary}</p>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
