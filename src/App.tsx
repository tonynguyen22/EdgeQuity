import { useState } from 'react';

import PeerAnalysis from './peer-analysis';
import QualityAnalysis from './quality-analysis';
import TechAnalysis from './tech-analysis';
import EarningsEstimates from './earnings-estimates';
import InsiderInstitutional from './insider-institutional';
import NewsSentiment from './news-sentiment';
import DividendAnalysis from './dividend-analysis';
import MultiplesAnalysis from './multiples-analysis';
import MarketCycle from './market-cycle';
import DDM from './ddm';
import ThreeStatement from './three-statement';
import DCFView from './dcf/DCFView';

import { clearAllCache } from './utils/storage';
import Sidebar from './dcf/components/Sidebar';
import LandingPage from './dcf/components/LandingPage';
import Footer from './components/Footer';
import type { TabId } from './dcf/types';

export default function App() {
  // ── App shell state ────────────────────────────────────────────────────────
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('dcf');
  const [cacheCleared, setCacheCleared] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleToggleNav = () => setNavCollapsed(prev => !prev);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setShowLanding(false);
  };

  const handleShowLanding = () => {
    setShowLanding(true);
  };

  const handleClearCache = () => {
    clearAllCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  // ── Tab content renderer ───────────────────────────────────────────────────
  const renderTabContent = () => {
    if (showLanding) return <LandingPage onTabChange={handleTabChange} />;

    switch (activeTab) {
      case 'comp':       return <PeerAnalysis />;
      case 'grade':      return <QualityAnalysis />;
      case 'multiples':  return <MultiplesAnalysis />;
      case 'ddm':        return <DDM />;
      case 'three-stmt': return <ThreeStatement />;
      case 'tech':       return <TechAnalysis />;
      case 'cycle':      return <MarketCycle />;
      case 'earnings':   return <EarningsEstimates />;
      case 'insider':    return <InsiderInstitutional />;
      case 'news':       return <NewsSentiment />;
      case 'dividend':   return <DividendAnalysis />;
      case 'dcf':
      default:           return <DCFView />;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-sans flex" style={{ background: 'var(--vw-bg-deep)', color: 'var(--vw-text-primary)' }}>
      <Sidebar
        showLanding={showLanding}
        activeTab={activeTab}
        cacheCleared={cacheCleared}
        collapsed={navCollapsed}
        onToggleCollapse={handleToggleNav}
        onShowLanding={handleShowLanding}
        onTabChange={handleTabChange}
        onClearCache={handleClearCache}
      />

      <div className="flex-1 min-w-0 vw-grid-bg flex flex-col min-h-screen">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderTabContent()}
        </main>
        <Footer />
      </div>
    </div>
  );
}
