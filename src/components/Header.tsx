import React from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, activeTab, setActiveTab }) => {
  return (
    <header className="border-b border-slate-200/80 bg-white sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <a href="/" className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            MinuteCard <span className="text-emerald-600 font-extrabold">POS</span>
          </a>
        </div>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'calculator' 
                ? 'text-emerald-700 font-semibold' 
                : 'hover:text-slate-900'
            }`}
          >
            ক্যালকুলেটর (Calculator)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rate-card')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'rate-card' 
                ? 'text-emerald-700 font-semibold' 
                : 'hover:text-slate-900'
            }`}
          >
            রেট টেবিল (Rates)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'guide' 
                ? 'text-emerald-700 font-semibold' 
                : 'hover:text-slate-900'
            }`}
          >
            ব্যবহার নির্দেশিকা (Guide)
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>নতুন হিসাব</span>
          </button>
        </div>

      </div>
    </header>
  );
};
