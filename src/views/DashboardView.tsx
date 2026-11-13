import React, { useState, useEffect } from 'react';
import {
  MapPin,
  RefreshCw,
  Clock,
  Sparkles,
  Leaf,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { LocationData, AqiStandard } from '../types/aqi';
import { getAqiCategory, formatRelativeTime } from '../lib/aqi';
import { AqiGauge } from '../components/AqiGauge';
import { PollutantCard } from '../components/PollutantCard';
import { WeatherWidget } from '../components/WeatherWidget';
import { AqiSparkline } from '../components/AqiSparkline';
import { UvWidget } from '../components/UvWidget';
import { BorderBeam } from '@/components/ui/border-beam';
import { Button } from '@/components/ui/button';
import { useThemeMode } from '@/lib/utils';

interface DashboardViewProps {
  data: LocationData | null;
  loading: boolean;
  error: string | null;
  standard: AqiStandard;
  onRefresh: () => void;
  isRefreshing: boolean;
  onSelectCity: (city: string) => void;
  onUseCurrentLocation: () => void;
  isLocating?: boolean;
  onOpenAiAssistant: () => void;
  onNavigateToMap: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  loading,
  error,
  standard,
  onRefresh,
  isRefreshing,
  onSelectCity,
  onUseCurrentLocation,
  isLocating,
  onOpenAiAssistant,
  onNavigateToMap,
}) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const beamTheme = useThemeMode();

  const popularCities = ['Delhi', 'London', 'New York', 'Tokyo', 'Shimla', 'Sydney', 'Paris'];

  // Auto-refresh interval (5 minutes)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      onRefresh();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  // Fetch AI summary when data changes
  useEffect(() => {
    if (!data) return;
    let isCancelled = false;
    setLoadingAi(true);

    fetch('/api/ai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: data }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (!isCancelled) {
          setAiInsight(res.summary || '');
          setLoadingAi(false);
        }
      })
      .catch(() => {
        if (!isCancelled) setLoadingAi(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [data?.city, data?.aqi]);

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 animate-pulse space-y-6">
        <div className="h-12 bg-slate-800/60 light:bg-slate-200 rounded-2xl w-2/3 sm:w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-80 sm:h-96 bg-slate-800/60 light:bg-slate-200 rounded-3xl" />
          <div className="lg:col-span-7 h-80 sm:h-96 bg-slate-800/60 light:bg-slate-200 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-800/60 light:bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-xl mx-3 sm:mx-auto my-12 sm:my-16 p-6 sm:p-8 bg-slate-900/90 light:bg-white rounded-3xl border border-rose-500/30 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-100 light:text-slate-900">
          Telemetry Stream Temporarily Unavailable
        </h3>
        <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">{error}</p>
        <Button
          type="button"
          onClick={onRefresh}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs gap-2 shadow-lg shadow-sky-500/20 min-h-[44px] h-auto touch-manipulation"
        >
          <RefreshCw className="w-4 h-4" /> Re-establish Live Stream
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const category = getAqiCategory(data.aqi, standard);

  return (
    <div className="relative isolate max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-7 space-y-5 sm:space-y-6">
      {/* Ambient Atmospheric Canvas Glow based on real-time AQI */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 opacity-15 pointer-events-none blur-3xl -z-10 transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at top, ${category.color} 0%, transparent 70%)`,
        }}
      />

      {/* Atmospheric Observatory Command Bar */}
      <BorderBeam
        size="md"
        colorVariant="ocean"
        theme={beamTheme}
        borderRadius={24}
        strength={0.8}
        className="w-full"
      >
        <div className="p-4 sm:p-5 bg-slate-900/80 light:bg-white rounded-3xl border border-slate-800/80 light:border-slate-200 shadow-xl backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
        {/* City & Station Identity */}
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0 mt-0.5 sm:mt-0">
              <MapPin className="w-5 h-5 text-sky-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-100 light:text-slate-900 tracking-tight break-words">
                  {data.city}
                </h1>
                <span
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider whitespace-nowrap"
                  style={{
                    backgroundColor: `${category.color}15`,
                    borderColor: `${category.color}40`,
                    color: category.color,
                  }}
                >
                  {category.name} Air
                </span>
              </div>
              <p className="text-xs text-slate-400 light:text-slate-500 mt-1 break-words">
                Monitoring Station: <span className="text-slate-200 light:text-slate-800 font-medium">{data.stationName}</span>
                <span className="mx-2 text-slate-700 hidden sm:inline">•</span>
                <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
                  {data.coordinates.lat.toFixed(3)}°N, {data.coordinates.lng.toFixed(3)}°E
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry Timestamp & Auto-Refresh Controls */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start lg:justify-end gap-3 text-xs w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800/60 light:border-slate-200 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-400 light:text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">Updated {formatRelativeTime(data.lastUpdated)}</span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-400 hover:text-slate-200 transition-colors min-h-[36px] py-1">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-700 text-sky-500 focus:ring-0 w-4 h-4"
              />
              <span className="whitespace-nowrap">Auto (5m)</span>
            </label>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 light:bg-slate-100 hover:bg-slate-700 light:hover:bg-slate-200 text-slate-200 light:text-slate-800 transition-all font-semibold text-xs shadow-sm min-h-[40px] h-auto touch-manipulation whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
          </Button>
        </div>
        </div>
      </BorderBeam>

      {/* Quick City Navigation Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold hover:bg-sky-500/20 whitespace-nowrap transition-colors disabled:opacity-70 min-h-[40px] touch-manipulation shrink-0"
        >
          <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-400' : ''}`} />
          {isLocating ? 'Triangulating GPS...' : 'My Location'}
        </button>
        <span className="text-slate-700 text-xs hidden sm:inline shrink-0">|</span>
        {popularCities.map((city) => {
          const isSelected = data.city.toLowerCase().includes(city.toLowerCase());
          return (
            <button
              key={`chip-${city}`}
              type="button"
              onClick={() => onSelectCity(city)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap shrink-0 min-h-[40px] touch-manipulation ${
                isSelected
                  ? 'bg-slate-100 text-slate-900 border-white light:bg-slate-900 light:text-white shadow-md'
                  : 'bg-slate-900/60 light:bg-slate-100 text-slate-300 light:text-slate-600 border-slate-800 light:border-slate-200 hover:border-slate-600'
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>

      {/* Main Observatory Grid: Radial Instrument + Weather Dynamics & Advisories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Column: AQI Circular Instrument (5 cols) */}
        <div className="lg:col-span-5 min-w-0">
          <AqiGauge
            aqi={data.aqi}
            category={category}
            standard={standard}
            dominant={data.dominant}
            badge={data.badge}
          />
        </div>

        {/* Right Column: Weather Dynamics, UV Spectrometry & Health Guidance (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 min-w-0">
          {/* Surface Meteorological Dynamics */}
          <WeatherWidget
            temperature={data.weather.temperature}
            humidity={data.weather.humidity}
            windSpeed={data.weather.windSpeed}
            uvIndex={data.uv?.uvIndex}
            uvCategory={data.uv?.category}
          />

          {/* Solar UV Index & Photobiological Risk */}
          <UvWidget
            uv={data.uv}
            lat={data.coordinates.lat}
            lng={data.coordinates.lng}
            city={data.city}
            aqi={data.aqi}
          />

          {/* Activity Recommendations & Health Guidance */}
          <div className="p-4 sm:p-6 bg-slate-900/90 light:bg-white rounded-3xl border border-slate-800/90 light:border-slate-200/90 shadow-xl backdrop-blur-xl space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80 light:border-slate-200/80">
              <h4 className="text-sm font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400 shrink-0" />
                Live Health & Clinical Activity Advisory
              </h4>
              <span className="text-[10px] font-mono text-slate-400 light:text-slate-500">
                BASED ON {category.name.toUpperCase()} AIR
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
              <div className="min-w-0 p-3 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[11px] font-medium truncate">Outdoor Exercise</span>
                <strong
                  className={`text-xs sm:text-sm block break-words ${
                    category.outdoorActivity === 'safe'
                      ? 'text-emerald-400'
                      : category.outdoorActivity === 'caution'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {category.outdoorActivity === 'safe'
                    ? 'Safe'
                    : category.outdoorActivity === 'caution'
                    ? 'Moderate'
                    : 'Avoid Exertion'}
                </strong>
              </div>

              <div className="min-w-0 p-3 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[11px] font-medium truncate">Ventilation</span>
                <strong
                  className={`text-xs sm:text-sm block break-words ${
                    category.windowOpen ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {category.windowOpen ? 'Windows Open' : 'Keep Shut'}
                </strong>
              </div>

              <div className="min-w-0 p-3 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[11px] font-medium truncate">N95 Respirator</span>
                <strong
                  className={`text-xs sm:text-sm block break-words ${
                    category.maskRecommended ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {category.maskRecommended ? 'Recommended' : 'Not Required'}
                </strong>
              </div>

              <div className="min-w-0 p-3 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[11px] font-medium truncate">Sensitive Cohorts</span>
                <strong
                  className={`text-xs sm:text-sm block break-words ${
                    category.level >= 3 ? 'text-rose-400' : 'text-slate-200 light:text-slate-700'
                  }`}
                >
                  {category.level >= 3 ? 'Remain Indoors' : 'Normal Routines'}
                </strong>
              </div>
            </div>

            <p className="text-xs text-slate-300 light:text-slate-600 leading-relaxed pt-1">
              {category.sensitiveAdvice}
            </p>

            {/* Quick Action Portal: Interactive Map */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onNavigateToMap}
                className="w-full text-left cursor-pointer p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-xs flex items-center justify-between gap-2 text-emerald-300 light:text-emerald-700 transition-colors min-h-[48px] touch-manipulation"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="leading-snug">
                    Explore <strong>Interactive Map</strong> &amp; green zones
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Atmospheric Trajectory & Spike Analysis */}
      <AqiSparkline
        data={data.sparkline}
        currentAqi={data.aqi}
        standard={standard}
        city={data.city}
        lat={data.coordinates.lat}
        lng={data.coordinates.lng}
      />

      {/* Spectrometric Pollutant Chemistry Matrix (6 Cards) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
              Spectrometric Pollutant Chemistry
            </h2>
            <p className="text-xs text-slate-400 light:text-slate-500">
              Continuous mass concentrations benchmarked against World Health Organization (WHO) 2021 air quality thresholds
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 self-start sm:self-auto whitespace-nowrap">
            {standard === 'US_EPA' ? 'US EPA Standard' : 'CPCB India Standard'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PollutantCard
            id="pm25"
            name="PM2.5"
            chemicalName="Fine Inhalable Combustion Particulates"
            value={data.pollutants.pm25}
            unit="µg/m³"
            whoLimit={15}
            standard={standard}
          />
          <PollutantCard
            id="pm10"
            name="PM10"
            chemicalName="Respirable Suspended Mineral Dust"
            value={data.pollutants.pm10}
            unit="µg/m³"
            whoLimit={45}
            standard={standard}
          />
          <PollutantCard
            id="no2"
            name="NO₂"
            chemicalName="Nitrogen Dioxide (Vehicular & Thermal)"
            value={data.pollutants.no2}
            unit="µg/m³"
            whoLimit={25}
            standard={standard}
          />
          <PollutantCard
            id="so2"
            name="SO₂"
            chemicalName="Sulfur Dioxide (Industrial Smelting)"
            value={data.pollutants.so2}
            unit="µg/m³"
            whoLimit={40}
            standard={standard}
          />
          <PollutantCard
            id="o3"
            name="O₃"
            chemicalName="Ground-Level Photochemical Ozone"
            value={data.pollutants.o3}
            unit="µg/m³"
            whoLimit={100}
            standard={standard}
          />
          <PollutantCard
            id="co"
            name="CO"
            chemicalName="Carbon Monoxide (Combustion)"
            value={data.pollutants.co}
            unit="mg/m³"
            whoLimit={4.0}
            standard={standard}
          />
        </div>
      </div>

      {/* AirIQ AI Atmospheric Summary Bulletin (Positioned at the end) */}
      <BorderBeam
        size="md"
        colorVariant="ice"
        theme={beamTheme}
        borderRadius={24}
        strength={0.85}
        className="w-full"
      >
        <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-sky-950/60 light:from-indigo-50 light:to-sky-50 border border-indigo-500/30 light:border-indigo-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl w-full">
        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5 border border-indigo-500/20">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 light:text-indigo-600">
                AirIQ AI Atmospheric Intelligence Dispatch
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 light:text-indigo-700 font-bold">
                GEMINI REASONING
              </span>
            </div>
            <p className="text-xs text-slate-300 light:text-slate-700 mt-1 leading-relaxed max-w-3xl">
              {loadingAi ? 'Synthesizing atmospheric indicators, meteorological vectors, and health recommendations...' : aiInsight}
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onOpenAiAssistant}
          className="w-full md:w-auto px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 shrink-0 transition-all shadow-md shadow-indigo-600/25 active:scale-95 min-h-[44px] h-auto touch-manipulation whitespace-nowrap"
        >
          Consult AI Assistant <ArrowRight className="w-4 h-4" />
        </Button>
        </div>
      </BorderBeam>
    </div>
  );
};
