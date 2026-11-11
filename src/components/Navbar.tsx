import React, { useState, useEffect, useRef } from 'react';
import {
  Wind,
  Search,
  MapPin,
  Moon,
  Sun,
  Bell,
  Bot,
  FileText,
  Share2,
  RefreshCw,
  Compass,
  Award,
} from 'lucide-react';
import { ActiveTab, AqiStandard, LocationData } from '../types/aqi';
import { AirIqBrandBadge } from './AirIqLogo';
import { useChampionProfile } from '../lib/useChampionProfile';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  standard: AqiStandard;
  setStandard: (std: AqiStandard) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
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
  darkMode,
  setDarkMode,
  onSearchCity,
  onUseCurrentLocation,
  onOpenAiAssistant,
  onOpenAlerts,
  onOpenReport,
  onOpenShare,
  onRefresh,
  isRefreshing,
  isLocating,
  currentLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<
    Array<{ name: string; country: string; admin1?: string; lat: number; lng: number }>
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const { profile } = useChampionProfile();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
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

  const navItems: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Live Dashboard', icon: 'BarChart3' },
    { id: '3d', label: '3D Atmosphere', icon: 'Box' },
    { id: 'map', label: 'Interactive Map', icon: 'Map' },
    { id: 'history', label: 'History & Spikes', icon: 'TrendingUp' },
    { id: 'forecast', label: 'AQI Forecast', icon: 'Calendar' },
    { id: 'comparison', label: 'Compare Cities', icon: 'Layers' },
    { id: 'health', label: 'Health & Safety', icon: 'HeartPulse' },
    { id: 'champion', label: 'Champion Rewards', icon: 'Award' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 light:bg-white/95 backdrop-blur-md border-b border-slate-800/80 light:border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <AirIqBrandBadge />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-sky-400 via-indigo-200 to-emerald-300 light:from-sky-600 light:to-indigo-700 bg-clip-text text-transparent">
                  AirIQ
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Live Telemetry Synchronized" />
              </div>
              <p className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-slate-400 light:text-slate-500 hidden sm:block">
                Atmospheric Intelligence
              </p>
            </div>
          </div>

          {/* Desktop Autocomplete Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                className="w-full pl-10 pr-10 py-2 bg-slate-900/90 light:bg-slate-100 border border-slate-700/80 light:border-slate-300 rounded-xl text-xs sm:text-sm text-slate-100 light:text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all placeholder:text-slate-500"
              />
              <button
                onClick={onUseCurrentLocation}
                title={isLocating ? 'Detecting exact GPS coordinates...' : 'Detect Exact Location'}
                aria-label="Detect Current Location"
                disabled={isLocating}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-sky-400 transition-colors disabled:opacity-70"
              >
                <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>

            {/* Suggestions Dropdown (Desktop) */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 light:bg-white border border-slate-700 light:border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800 light:divide-slate-100">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSearchCity(`${item.name}, ${item.country}`, { lat: item.lat, lng: item.lng });
                      setShowDropdown(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between text-xs hover:bg-slate-800 light:hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-200 light:text-slate-900">
                        {item.name}
                      </span>
                      {item.admin1 && (
                        <span className="text-slate-400 light:text-slate-500">
                          ({item.admin1})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{item.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Controls & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              title="Search Location"
              aria-label="Toggle Mobile Search"
              className={`p-2 rounded-xl border md:hidden transition-colors flex items-center justify-center min-w-[36px] min-h-[36px] ${
                showMobileSearch
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                  : 'bg-slate-900 light:bg-slate-100 text-slate-300 light:text-slate-700 border-slate-800 light:border-slate-300'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Standard Toggle (EPA vs CPCB) */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-200 text-xs">
              <button
                onClick={() => setStandard('US_EPA')}
                className={`px-2 sm:px-2.5 py-1 rounded-md font-bold text-[10px] sm:text-[11px] transition-all ${
                  standard === 'US_EPA'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
                title="United States Environmental Protection Agency AQI"
              >
                <span className="hidden sm:inline">US </span>EPA
              </button>
              <button
                onClick={() => setStandard('INDIA_CPCB')}
                className={`px-2 sm:px-2.5 py-1 rounded-md font-bold text-[10px] sm:text-[11px] transition-all ${
                  standard === 'INDIA_CPCB'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
                title="Central Pollution Control Board (India) AQI"
              >
                <span className="hidden sm:inline">IN </span>CPCB
              </button>
            </div>

            {/* Clean Air Champion Profile Button */}
            <button
              onClick={() => setActiveTab('champion')}
              title={`Clean Air Champion: ${profile.rankTier} (Level ${profile.level})`}
              aria-label="Clean Air Champion Rewards & Profile"
              className={`px-2 sm:px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 min-h-[36px] touch-manipulation ${
                activeTab === 'champion'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 border-slate-800 light:border-slate-300 text-slate-300 light:text-slate-700'
              }`}
            >
              <span className="text-sm sm:text-base leading-none">{profile.avatar}</span>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[10px] font-bold tracking-tight text-amber-400 leading-none">
                  Lvl {profile.level}
                </span>
                <span className="text-[9px] font-mono text-slate-400 light:text-slate-500 leading-none mt-0.5">
                  {profile.xp} XP · 🔥{profile.currentStreak}d
                </span>
              </div>
              <Award className="w-3.5 h-3.5 text-amber-400 sm:hidden" />
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAiAssistant}
              title="AirIQ AI Assistant (Gemini)"
              aria-label="Open AI Assistant"
              className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold min-w-[36px] min-h-[36px]"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden lg:inline">AI Intel</span>
            </button>

            {/* Smart Alerts */}
            <button
              onClick={onOpenAlerts}
              title="Configure Smart AQI Alerts"
              aria-label="Configure Smart AQI Alerts"
              className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Report (visible on tablet+) */}
            <button
              onClick={onOpenReport}
              title="View Impact Report"
              aria-label="View Impact Report"
              className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors hidden sm:flex items-center justify-center min-w-[36px] min-h-[36px]"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* Share (visible on tablet+) */}
            <button
              onClick={onOpenShare}
              title="Share Card"
              aria-label="Share Card"
              className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors hidden sm:flex items-center justify-center min-w-[36px] min-h-[36px]"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh Data"
              aria-label="Refresh Data"
              className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar Drawer */}
        {showMobileSearch && (
          <div
            ref={mobileSearchRef}
            className="md:hidden pb-3 pt-1 border-t border-slate-800/60 light:border-slate-200 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900 light:bg-slate-100 border border-slate-700 light:border-slate-300 rounded-xl text-xs text-slate-100 light:text-slate-900 focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-500 shadow-inner"
              />
              <button
                onClick={() => {
                  onUseCurrentLocation();
                  setShowMobileSearch(false);
                }}
                title={isLocating ? 'Detecting exact GPS coordinates...' : 'Detect Exact Location'}
                aria-label="Detect Current Location"
                disabled={isLocating}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-sky-400 transition-colors disabled:opacity-70"
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
                    onClick={() => {
                      onSearchCity(`${item.name}, ${item.country}`, { lat: item.lat, lng: item.lng });
                      setShowDropdown(false);
                      setShowMobileSearch(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-800 light:hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
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

        {/* Desktop Tabs Navigation */}
        <nav className="hidden md:flex items-center space-x-1 border-t border-slate-800/40 light:border-slate-200/80 py-2 overflow-x-auto no-scrollbar scroll-smooth">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap touch-manipulation active:scale-95 ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800 hover:bg-slate-900/40'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
