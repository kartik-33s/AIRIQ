import React, { useState } from 'react';
import {
  Wind,
  Compass,
  Flame,
  CloudRain,
  Navigation,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldCheck,
  Zap,
  MapPin,
  Eye,
  Sliders,
} from 'lucide-react';
import { WindDispersionData } from '../types/aqi';

interface WindDispersionHudProps {
  data: WindDispersionData | null;
  loading: boolean;
  showWindParticles: boolean;
  onToggleWindParticles: () => void;
  showSmokeMode: boolean;
  onToggleSmokeMode: () => void;
  showVectorArrows: boolean;
  onToggleVectorArrows: () => void;
  onSelectPreset: (lat: number, lng: number, name: string) => void;
  activeCityName: string;
}

export const WindDispersionHud: React.FC<WindDispersionHudProps> = ({
  data,
  loading,
  showWindParticles,
  onToggleWindParticles,
  showSmokeMode,
  onToggleSmokeMode,
  showVectorArrows,
  onToggleVectorArrows,
  onSelectPreset,
  activeCityName,
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 640;
    }
    return true;
  });

  const presets = [
    { name: 'Delhi', lat: 28.6139, lng: 77.209, label: 'Delhi (Stubble Smog Corridor)' },
    { name: 'Mumbai', lat: 18.922, lng: 72.834, label: 'Mumbai (Coastal Sea Breeze)' },
    { name: 'London', lat: 51.5074, lng: -0.1278, label: 'London (Atlantic Westerlies)' },
    { name: 'New York', lat: 40.7128, lng: -74.006, label: 'New York (Hudson Basin)' },
  ];

  if (!data) return null;

  const { center, cardinal, originAnalysis, ventilation } = data;
  const blowTowardDeg = (center.windDirection + 180) % 360;

  return (
    <div className="absolute bottom-16 sm:bottom-6 right-2 sm:right-4 left-2 sm:left-auto w-auto sm:w-96 z-[999] bg-slate-900/95 light:bg-white/95 backdrop-blur-md rounded-2xl border border-slate-700/80 light:border-slate-300 shadow-2xl overflow-hidden transition-all text-xs">
      {/* Top Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 sm:p-3.5 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 light:from-slate-50 light:to-sky-50 border-b border-slate-800 light:border-slate-200 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-100 light:text-slate-900 text-xs">
                Wind Vector & Smoke Dispersion
              </h4>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 light:text-slate-500">
              {cardinal} ({center.windDirection}°) at {center.windSpeed} km/h • {activeCityName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-[10px] font-semibold text-sky-400 hidden sm:inline">
            {isExpanded ? 'Collapse' : 'Details'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-3.5 max-h-[calc(100vh-14rem)] overflow-y-auto no-scrollbar">
          {/* Compass Rose & Velocity Banner */}
          <div className="grid grid-cols-12 gap-3 p-3 rounded-xl bg-slate-800/40 light:bg-slate-100 border border-slate-700/40 light:border-slate-200">
            {/* Rotating 3D Compass */}
            <div className="col-span-4 flex flex-col items-center justify-center border-r border-slate-700/50 light:border-slate-200 pr-2">
              <div className="relative w-14 h-14 rounded-full border-2 border-slate-700 light:border-slate-300 flex items-center justify-center bg-slate-900 light:bg-white shadow-inner">
                {/* Cardinal labels */}
                <span className="absolute top-0.5 text-[8px] font-bold text-rose-500">N</span>
                <span className="absolute bottom-0.5 text-[8px] font-semibold text-slate-400">S</span>
                <span className="absolute right-1 text-[8px] font-semibold text-slate-400">E</span>
                <span className="absolute left-1 text-[8px] font-semibold text-slate-400">W</span>

                {/* Rotating Wind Arrow pointing TOWARD where wind blows */}
                <div
                  className="w-8 h-8 flex items-center justify-center transition-transform duration-500"
                  style={{ transform: `rotate(${blowTowardDeg}deg)` }}
                >
                  <Navigation className="w-6 h-6 text-sky-400 fill-sky-400" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-200 light:text-slate-800 mt-1">
                From {cardinal}
              </span>
            </div>

            {/* Velocity & Gusts */}
            <div className="col-span-8 flex flex-col justify-center space-y-1.5 pl-1">
              <div className="flex items-baseline justify-between">
                <span className="text-slate-400 text-[11px]">Wind Velocity:</span>
                <strong className="text-sm font-black font-mono text-slate-100 light:text-slate-900">
                  {center.windSpeed} km/h
                </strong>
              </div>

              <div className="flex items-baseline justify-between text-[11px]">
                <span className="text-slate-400">Gust Peak:</span>
                <span className="font-mono text-slate-300 light:text-slate-700 font-bold">
                  {center.windGusts} km/h
                </span>
              </div>

              {center.dust !== null && (
                <div className="flex items-baseline justify-between text-[11px] border-t border-slate-700/40 light:border-slate-200 pt-1">
                  <span className="text-slate-400">Desert Dust Flux:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {center.dust} µg/m³
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Transboundary Smoke / Air Mass Origin Card */}
          <div className="p-3 rounded-xl bg-slate-800/40 light:bg-slate-50 border border-slate-700/40 light:border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Flame className="w-3 h-3" /> Transboundary Air Corridor
              </span>
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {originAnalysis.sourceRegion.split(' ')[0]}
              </span>
            </div>

            <h5 className="font-bold text-slate-100 light:text-slate-900 text-xs">
              {originAnalysis.title}
            </h5>
            <p className="text-[11px] text-slate-300 light:text-slate-600 leading-relaxed">
              {originAnalysis.description}
            </p>
          </div>

          {/* Stagnant Inversion vs Ventilation Gauge */}
          <div className="p-3 rounded-xl bg-slate-800/40 light:bg-slate-50 border border-slate-700/40 light:border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                Atmospheric Flushing Index
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  ventilation.riskLevel === 'Severe Risk'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : ventilation.riskLevel === 'Caution'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {ventilation.status}
              </span>
            </div>

            {/* Score progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-700 light:bg-slate-200 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  ventilation.score < 30
                    ? 'bg-rose-500'
                    : ventilation.score < 65
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${ventilation.score}%` }}
              />
            </div>

            <p className="text-[10.5px] text-slate-400 light:text-slate-600 italic">
              {ventilation.advice}
            </p>
          </div>

          {/* Interactive Layer Switches */}
          <div className="pt-1 border-t border-slate-800 light:border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Simulation Layer Toggles
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                onClick={onToggleWindParticles}
                className={`py-1.5 px-2 rounded-lg font-semibold border flex items-center justify-center gap-1 transition-colors ${
                  showWindParticles
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                    : 'bg-slate-800 light:bg-slate-100 text-slate-400 border-slate-700 light:border-slate-200'
                }`}
              >
                <Wind className="w-3 h-3" />
                Streamlines
              </button>

              <button
                onClick={onToggleSmokeMode}
                className={`py-1.5 px-2 rounded-lg font-semibold border flex items-center justify-center gap-1 transition-colors ${
                  showSmokeMode
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800 light:bg-slate-100 text-slate-400 border-slate-700 light:border-slate-200'
                }`}
              >
                <Flame className="w-3 h-3" />
                Smoke Plumes
              </button>

              <button
                onClick={onToggleVectorArrows}
                className={`py-1.5 px-2 rounded-lg font-semibold border flex items-center justify-center gap-1 transition-colors ${
                  showVectorArrows
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 light:bg-slate-100 text-slate-400 border-slate-700 light:border-slate-200'
                }`}
              >
                <Navigation className="w-3 h-3" />
                Vectors
              </button>
            </div>
          </div>

          {/* Real-World Global Atmospheric Corridors Presets */}
          <div className="pt-2 border-t border-slate-800 light:border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Explore Known Smog & Breeze Corridors
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => onSelectPreset(p.lat, p.lng, p.name)}
                  className={`p-1.5 rounded-lg border text-left transition-colors truncate ${
                    activeCityName.toLowerCase().includes(p.name.toLowerCase())
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold'
                      : 'bg-slate-800/40 light:bg-slate-100 text-slate-300 light:text-slate-600 border-slate-700/40 light:border-slate-200 hover:border-slate-500'
                  }`}
                  title={p.label}
                >
                  <span className="block truncate font-medium text-[10px]">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
