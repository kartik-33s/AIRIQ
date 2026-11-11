import React, { useRef, useEffect } from 'react';
import { BarChart3, Map, TrendingUp, Calendar, Layers, HeartPulse, Box, Award } from 'lucide-react';
import { ActiveTab } from '../types/aqi';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navContainerRef = useRef<HTMLElement>(null);

  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Live', icon: BarChart3 },
    { id: 'champion', label: 'Rewards', icon: Award },
    { id: '3d', label: '3D Twin', icon: Box },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'history', label: 'History', icon: TrendingUp },
    { id: 'forecast', label: 'Forecast', icon: Calendar },
    { id: 'comparison', label: 'Compare', icon: Layers },
    { id: 'health', label: 'Health', icon: HeartPulse },
  ];

  // Auto-scroll the active tab into view when activeTab changes
  useEffect(() => {
    if (navContainerRef.current) {
      const activeEl = navContainerRef.current.querySelector<HTMLButtonElement>(`[data-tab="${activeTab}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeTab]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 light:bg-white/95 backdrop-blur-xl border-t border-slate-800/90 light:border-slate-200 px-1 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-2xl">
      <nav
        ref={navContainerRef}
        className="flex items-center justify-between sm:justify-around overflow-x-auto no-scrollbar scroll-smooth gap-1 px-1"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-w-[50px] min-h-[48px] shrink-0 transition-all active:scale-90 touch-manipulation ${
                isActive
                  ? 'text-sky-400 font-bold bg-sky-500/15 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'scale-110 text-sky-400' : ''} transition-transform`} />
              <span className={`text-[9px] sm:text-[10px] mt-0.5 tracking-tight whitespace-nowrap ${isActive ? 'font-black text-sky-400' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

