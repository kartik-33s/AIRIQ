import React from 'react';
import { BarChart3, Map, TrendingUp, Calendar, Layers, HeartPulse, Box } from 'lucide-react';
import { ActiveTab } from '../types/aqi';
import { BottomNavBar, BottomNavItem } from '@/components/ui/bottom-nav-bar';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const AIRIQ_NAV_ITEMS: (BottomNavItem & { id: ActiveTab })[] = [
  { id: 'dashboard', label: 'Live', icon: BarChart3 },
  { id: '3d', label: '3D Twin', icon: Box },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'history', label: 'History', icon: TrendingUp },
  { id: 'forecast', label: 'Forecast', icon: Calendar },
  { id: 'comparison', label: 'Compare', icon: Layers },
  { id: 'health', label: 'Health', icon: HeartPulse },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const activeIndex = Math.max(
    0,
    AIRIQ_NAV_ITEMS.findIndex((item) => item.id === activeTab)
  );

  return (
    <div className="md:hidden">
      <BottomNavBar
        items={AIRIQ_NAV_ITEMS}
        activeIndex={activeIndex}
        onSelect={(_, item) => {
          if (item.id) {
            setActiveTab(item.id as ActiveTab);
          }
        }}
        stickyBottom
        ariaLabel="Mobile navigation"
      />
    </div>
  );
};
