import React from 'react';
import { BarChart3, Map, TrendingUp, Calendar, Layers, HeartPulse, Box } from 'lucide-react';
import { ActiveTab } from '../types/aqi';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Live', icon: BarChart3 },
    { id: '3d', label: '3D Twin', icon: Box },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'history', label: 'History', icon: TrendingUp },
    { id: 'forecast', label: 'Forecast', icon: Calendar },
    { id: 'comparison', label: 'Compare', icon: Layers },
    { id: 'health', label: 'Health', icon: HeartPulse },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 light:bg-white/95 backdrop-blur-lg border-t border-slate-800 light:border-slate-200 px-2 py-1 safe-area-pb">
      <nav className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-w-[50px] min-h-[48px] transition-colors ${
                isActive
                  ? 'text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
