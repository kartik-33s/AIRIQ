import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Bell,
  Bot,
  FileText,
  Share2,
  RefreshCw,
  Compass,
  MoreVertical,
  X,
} from 'lucide-react';
import { ActiveTab, AqiStandard, LocationData } from '../types/aqi';
import { AirIqBrandBadge } from './AirIqLogo';
import { BottomNavBar } from '@/components/ui/bottom-nav-bar';
import { AIRIQ_NAV_ITEMS } from './BottomNav';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  standard: AqiStandard;
  setStandard: (std: AqiStandard) => void;
  onSearchCity: (city: string, coords?: { lat: number; lng: number }) => void;
  onUseCurrentLocation: () => void;
  onOpenAiAssistant: () => void;
  onOpenAlerts: () => void;
  onOpenReport: () => void;
  onOpenShare: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLocating?: boolean;
  currentLocation: LocationData | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  standard,
  setStandard,
  onSearchCity,
  onUseCurrentLocation,
  onOpenAiAssistant,
  onOpenAlerts,
  onOpenReport,
  onOpenShare,
  onRefresh,
  isRefreshing,
  isLocating,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<
    Array<{ name: string; country: string; admin1?: string; lat: number; lng: number }>
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown & mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDesktopSearch = searchRef.current?.contains(target);
      const inMobileSearch = mobileSearchRef.current?.contains(target);
      if (!inDesktopSearch && !inMobileSearch) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/aqi/search?q=${encodeURIComponent(searchQuery)}`);
        const json = await resp.json();
        if (json.results) {
          setSuggestions(json.results);
          setShowDropdown(true);
        }
      } catch {
        // Ignore
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeNavIndex = Math.max(
    0,
    AIRIQ_NAV_ITEMS.findIndex((item) => item.id === activeTab)
  );

  return (
    <header className="sticky top-0 z-40 bg-black/95 light:bg-white/95 backdrop-blur-md border-b border-slate-800/80 light:border-slate-200">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-4">
          {/* Logo & Brand */}
          <button
            type="button"
            className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 cursor-pointer group text-left min-h-[44px]"
            onClick={() => setActiveTab('dashboard')}
          >
            <AirIqBrandBadge />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-2xl font-black tracking-tight bg-gradient-to-r from-sky-400 via-indigo-200 to-emerald-300 light:from-sky-600 light:to-indigo-700 bg-clip-text text-transparent whitespace-nowrap">
                  AirIQ
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-slate-400 light:text-slate-500 hidden sm:block whitespace-nowrap">
                Atmospheric Intelligence
              </p>
            </div>
          </button>

          {/* Desktop Autocomplete Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block min-w-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    onSearchCity(searchQuery.trim());
                    setShowDropdown(false);
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder="Search global city or station (e.g. Delhi, London, Tokyo)..."
                className="w-full pl-10 pr-10 py-2 bg-slate-900/90 light:bg-slate-100 border border-slate-700/80 light:border-slate-300 rounded-xl text-xs sm:text-sm text-slate-100 light:text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all placeholder:text-slate-500 min-h-[40px]"
              />
              <button
                type="button"
                onClick={onUseCurrentLocation}
                title={isLocating ? 'Detecting exact GPS coordinates...' : 'Detect Exact Location'}
                aria-label="Detect Current Location"
                disabled={isLocating}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-sky-400 transition-colors disabled:opacity-70 min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>

            {/* Suggestions Dropdown (Desktop) */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 light:bg-white border border-slate-700 light:border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800 light:divide-slate-100 max-h-72 overflow-y-auto">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSearchCity(`${item.name}, ${item.country}`, { lat: item.lat, lng: item.lng });
                      setShowDropdown(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between text-xs hover:bg-slate-800 light:hover:bg-slate-50 transition-colors min-h-[42px]"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-200 light:text-slate-900 truncate">
                        {item.name}
                      </span>
                      {item.admin1 && (
                        <span className="text-slate-400 light:text-slate-500 truncate">
                          ({item.admin1})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">{item.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Controls & Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setShowMobileSearch((prev) => !prev);
                setShowMobileMenu(false);
              }}
              title="Search Location"
              aria-label="Toggle Mobile Search"
              className={`p-1.5 sm:p-2 rounded-xl border md:hidden transition-colors flex items-center justify-center min-w-[36px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] touch-manipulation ${
                showMobileSearch
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                  : 'bg-slate-900 light:bg-slate-100 text-slate-300 light:text-slate-700 border-slate-800 light:border-slate-300'
              }`}
            >
              {showMobileSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            {/* Standard Toggle (EPA vs CPCB) */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-200 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setStandard('US_EPA')}
                className={`px-1.5 sm:px-2.5 py-1.5 rounded-lg font-bold text-[10px] sm:text-[11px] transition-all whitespace-nowrap min-h-[34px] touch-manipulation ${
                  standard === 'US_EPA'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
                title="United States Environmental Protection Agency AQI"
              >
                <span className="hidden sm:inline">US </span>EPA
              </button>
              <button
                type="button"
                onClick={() => setStandard('INDIA_CPCB')}
                className={`px-1.5 sm:px-2.5 py-1.5 rounded-lg font-bold text-[10px] sm:text-[11px] transition-all whitespace-nowrap min-h-[34px] touch-manipulation ${
                  standard === 'INDIA_CPCB'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
                title="Central Pollution Control Board (India) AQI"
              >
                <span className="hidden sm:inline">IN </span>CPCB
              </button>
            </div>

            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={onOpenAiAssistant}
              title="AirIQ AI Assistant (Gemini)"
              aria-label="Open AI Assistant"
              className="p-1.5 sm:p-2 sm:px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold min-w-[36px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] whitespace-nowrap touch-manipulation"
            >
              <Bot className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">AI Intel</span>
            </button>

            {/* Desktop/Tablet Full Action Buttons */}
            <div className="hidden sm:flex items-center gap-1.5">
              {/* Smart Alerts */}
              <button
                type="button"
                onClick={onOpenAlerts}
                title="Configure Smart AQI Alerts"
                aria-label="Configure Smart AQI Alerts"
                className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors flex items-center justify-center min-w-[40px] min-h-[40px] touch-manipulation"
              >
                <Bell className="w-4 h-4" />
              </button>

              {/* Report */}
              <button
                type="button"
                onClick={onOpenReport}
                title="View Impact Report"
                aria-label="View Impact Report"
                className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors flex items-center justify-center min-w-[40px] min-h-[40px] touch-manipulation"
              >
                <FileText className="w-4 h-4" />
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={onOpenShare}
                title="Share Card"
                aria-label="Share Card"
                className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors flex items-center justify-center min-w-[40px] min-h-[40px] touch-manipulation"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Refresh */}
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh Data"
                aria-label="Refresh Data"
                className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors flex items-center justify-center min-w-[40px] min-h-[40px] touch-manipulation"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>

            {/* Mobile Utility Menu Trigger (keeps all tools 1-tap reachable on <640px phones) */}
            <div ref={mobileMenuRef} className="relative sm:hidden">
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu((prev) => !prev);
                  setShowMobileSearch(false);
                }}
                aria-label="More Tools & Settings"
                aria-expanded={showMobileMenu}
                className={`p-1.5 sm:p-2 rounded-xl border transition-colors flex items-center justify-center min-w-[36px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] touch-manipulation ${
                  showMobileMenu
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                    : 'bg-slate-900 light:bg-slate-100 text-slate-300 light:text-slate-700 border-slate-800 light:border-slate-300'
                }`}
              >
                {showMobileMenu ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
              </button>

              {showMobileMenu && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-slate-900 light:bg-white border border-slate-700/80 light:border-slate-200 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onRefresh();
                      setShowMobileMenu(false);
                    }}
                    disabled={isRefreshing}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-200 light:text-slate-800 hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 min-h-[44px] touch-manipulation"
                  >
                    <RefreshCw className={`w-4 h-4 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh Telemetry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenAlerts();
                      setShowMobileMenu(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-200 light:text-slate-800 hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 min-h-[44px] touch-manipulation"
                  >
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Smart AQI Alerts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenReport();
                      setShowMobileMenu(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-200 light:text-slate-800 hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 min-h-[44px] touch-manipulation"
                  >
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span>Impact & Health Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenShare();
                      setShowMobileMenu(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-200 light:text-slate-800 hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 min-h-[44px] touch-manipulation"
                  >
                    <Share2 className="w-4 h-4 text-indigo-400" />
                    <span>Share AQI Card</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Expandable Search Bar Drawer */}
        {showMobileSearch && (
          <div
            ref={mobileSearchRef}
            className="md:hidden pb-3 pt-1.5 border-t border-slate-800/60 light:border-slate-200"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    onSearchCity(searchQuery.trim());
                    setShowDropdown(false);
                    setShowMobileSearch(false);
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder="Search global city or station..."
                autoFocus
                className="w-full pl-10 pr-11 py-2.5 bg-slate-900 light:bg-slate-100 border border-slate-700 light:border-slate-300 rounded-xl text-xs text-slate-100 light:text-slate-900 focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-500 shadow-inner min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => {
                  onUseCurrentLocation();
                  setShowMobileSearch(false);
                }}
                title={isLocating ? 'Detecting exact GPS coordinates...' : 'Detect Exact Location'}
                aria-label="Detect Current Location"
                disabled={isLocating}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-sky-400 transition-colors disabled:opacity-70 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>

            {/* Mobile Autocomplete Suggestions Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="mt-1.5 bg-slate-900 light:bg-white border border-slate-700 light:border-slate-200 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800 light:divide-slate-100 max-h-60 overflow-y-auto">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSearchCity(`${item.name}, ${item.country}`, { lat: item.lat, lng: item.lng });
                      setShowDropdown(false);
                      setShowMobileSearch(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs hover:bg-slate-800 light:hover:bg-slate-50 transition-colors min-h-[44px]"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-200 light:text-slate-900 truncate">
                        {item.name}
                      </span>
                      {item.admin1 && (
                        <span className="text-slate-400 light:text-slate-500 text-[11px] truncate">
                          ({item.admin1})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{item.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Desktop & Tablet Animated Pill Navigation */}
        <div className="hidden md:flex items-center justify-center border-t border-slate-800/40 light:border-slate-200/80 py-2 max-w-full overflow-x-clip">
          <BottomNavBar
            items={AIRIQ_NAV_ITEMS}
            activeIndex={activeNavIndex}
            onSelect={(_, item) => {
              if (item.id) {
                setActiveTab(item.id as ActiveTab);
              }
            }}
            ariaLabel="Primary sections"
            className="shadow-md max-w-full"
          />
        </div>
      </div>
    </header>
  );
};
