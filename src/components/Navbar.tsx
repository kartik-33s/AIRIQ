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
  Box,
} from 'lucide-react';
import { ActiveTab, AqiStandard, LocationData } from '../types/aqi';

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
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
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
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 light:bg-white/90 backdrop-blur-md border-b border-slate-800/80 light:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-sky-400 via-indigo-200 to-emerald-300 light:from-sky-600 light:to-indigo-700 bg-clip-text text-transparent">
                  AirIQ
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 light:text-slate-500 hidden sm:block">
                Real-Time Intelligence
              </p>
            </div>
          </div>

          {/* Autocomplete Search Bar */}
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
                placeholder="Search any global city or station (e.g. Delhi, London, Tokyo)..."
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

            {/* Suggestions Dropdown */}
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
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Standard Toggle (EPA vs CPCB) */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-200 text-xs">
              <button
                onClick={() => setStandard('US_EPA')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                  standard === 'US_EPA'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
                title="United States Environmental Protection Agency AQI"
              >
                US EPA
              </button>
              <button
                onClick={() => setStandard('INDIA_CPCB')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all ${
                  standard === 'INDIA_CPCB'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
                }`}
                title="Central Pollution Control Board (India) AQI"
              >
                IN CPCB
              </button>
            </div>

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAiAssistant}
              title="AirIQ AI Assistant (Gemini)"
              aria-label="Open AI Assistant"
              className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden lg:inline">AI Intel</span>
            </button>

            {/* Smart Alerts */}
            <button
              onClick={onOpenAlerts}
              title="Configure Smart AQI Alerts"
              aria-label="Configure Smart AQI Alerts"
              className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Report */}
            <button
              onClick={onOpenReport}
              title="View Impact Report"
              aria-label="View Impact Report"
              className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors hidden sm:flex"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* Share */}
            <button
              onClick={onOpenShare}
              title="Share Card"
              aria-label="Share Card"
              className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors hidden sm:flex"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh Data"
              aria-label="Refresh Data"
              className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Desktop Tabs Navigation */}
        <nav className="hidden md:flex space-x-1 border-t border-slate-800/40 light:border-slate-200/80 py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800 hover:bg-slate-900/40'
                }`}
              >
                {item.id === '3d' && <Box className="w-3.5 h-3.5 text-sky-400" />}
                <span>{item.label}</span>
                {item.id === '3d' && (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold tracking-wider">
                    NEW
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
