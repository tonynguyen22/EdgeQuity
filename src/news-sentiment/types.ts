export interface NewsArticle {
  headline: string;
  summary?: string;
  source: string;
  datetime: number;
  url: string;
  image?: string;
  category?: string;
}

export interface SentimentData {
  sentiment?: {
    bullishPercent?: number;
    bearishPercent?: number;
  };
  buzz?: {
    buzz?: number;
    articlesInLastWeek?: number;
  };
  companyNewsScore?: number;
  sectorAverageNewsScore?: number;
  sectorAverageBullishPercent?: number;
}

export interface NewsData {
  articles: NewsArticle[];
  sentiment: SentimentData;
}
