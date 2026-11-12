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
  Info,
  ChevronDown,
  ChevronUp,
  Box,
  Activity,
  Wind,
  Layers,
} from 'lucide-react';
import { LocationData, AqiStandard } from '../types/aqi';
import { getAqiCategory, formatRelativeTime } from '../lib/aqi';
import { AqiGauge } from '../components/AqiGauge';
import { PollutantCard } from '../components/PollutantCard';
import { WeatherWidget } from '../components/WeatherWidget';
import { AqiSparkline } from '../components/AqiSparkline';
import { UvWidget } from '../components/UvWidget';

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
  onNavigateTo3D?: () => void;
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
  onNavigateTo3D,
}) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showScaleExplainer, setShowScaleExplainer] = useState(false);

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
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-10 bg-slate-800/60 light:bg-slate-200 rounded-2xl w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-96 bg-slate-800/60 light:bg-slate-200 rounded-3xl" />
          <div className="lg:col-span-7 h-96 bg-slate-800/60 light:bg-slate-200 rounded-3xl" />
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
      <div className="max-w-xl mx-auto my-16 p-8 bg-slate-900/90 light:bg-white rounded-3xl border border-rose-500/30 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 light:text-slate-900">
          Telemetry Stream Temporarily Unavailable
        </h3>
        <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">{error}</p>
        <button
          onClick={onRefresh}
          className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors inline-flex items-center gap-2 shadow-lg shadow-sky-500/20"
        >
          <RefreshCw className="w-4 h-4" /> Re-establish Live Stream
        </button>
      </div>
    );
  }

  if (!data) return null;

  const category = getAqiCategory(data.aqi, standard);

  return (
    <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
      {/* Ambient Atmospheric Canvas Glow based on real-time AQI */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 opacity-15 pointer-events-none blur-3xl -z-10 transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at top, ${category.color} 0%, transparent 70%)`,
        }}
      />

      {/* Atmospheric Observatory Command Bar */}
      <div className="p-4 sm:p-5 bg-slate-900/80 light:bg-white rounded-3xl border border-slate-800/80 light:border-slate-200 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* City & Station Identity */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <MapPin className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-100 light:text-slate-900 tracking-tight">
                  {data.city}
                </h1>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider hidden sm:inline"
                  style={{
                    backgroundColor: `${category.color}15`,
                    borderColor: `${category.color}40`,
                    color: category.color,
                  }}
                >
                  {category.name} Air
                </span>
              </div>
              <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
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
        <div className="flex flex-wrap items-center gap-3 text-xs self-start md:self-auto border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/60 light:border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-400 light:text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated {formatRelativeTime(data.lastUpdated)}</span>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-400 hover:text-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 text-sky-500 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Auto (5m)</span>
          </label>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 light:bg-slate-100 hover:bg-slate-700 light:hover:bg-slate-200 text-slate-200 light:text-slate-800 transition-all font-semibold text-xs shadow-sm min-h-[36px] touch-manipulation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Quick City Navigation Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold hover:bg-sky-500/20 whitespace-nowrap transition-colors disabled:opacity-70 min-h-[36px] touch-manipulation shrink-0"
        >
          <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-400' : ''}`} />
          {isLocating ? 'Triangulating GPS...' : 'My Location'}
        </button>
        <span className="text-slate-700 text-xs hidden sm:inline">|</span>
        {popularCities.map((city) => {
          const isSelected = data.city.toLowerCase().includes(city.toLowerCase());
          return (
            <button
              key={`chip-${city}`}
              onClick={() => onSelectCity(city)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap shrink-0 min-h-[36px] touch-manipulation ${
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

      {/* 3D Atmospheric Digital Twin Interactive Portal */}
      {onNavigateTo3D && (
        <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-950/60 via-slate-900/90 to-indigo-950/60 light:from-sky-50 light:to-indigo-50 border border-sky-500/30 light:border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl overflow-hidden group">
          {/* Background Technical Grid Accent */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.4) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="flex items-start gap-3.5 z-10">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/40 text-sky-400 shrink-0 shadow-lg shadow-sky-500/10">
              <Box className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 light:text-sky-600">
                  Three.js 3D Atmospheric Digital Twin
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono font-bold tracking-wider">
                  INTERACTIVE PBR
                </span>
              </div>
              <p className="text-xs text-slate-300 light:text-slate-700 mt-1 leading-relaxed max-w-2xl">
                Inspect the 10-part procedural monitoring station with laser nephelometer, exploded kinematic layer separation, dynamic solar azimuth, and city-scale smog dispersion.
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateTo3D}
            className="z-10 w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 transition-all shadow-lg shadow-sky-500/25 active:scale-95 min-h-[44px] touch-manipulation"
          >
            Launch 3D Twin <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scale Science Explainer Accordion (500 Regulatory Cap vs 1,000+ Spikes) */}
      <div className="rounded-3xl border border-sky-500/20 bg-sky-950/20 light:bg-sky-50/70 p-4 sm:p-5 transition-all shadow-sm">
        <button
          onClick={() => setShowScaleExplainer(!showScaleExplainer)}
          className="w-full flex items-center justify-between text-left gap-3 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-100 light:text-slate-900 block">
                Why does Google / IQAir show 1,000+ AQI while official agencies report ~200–500?
              </span>
              <span className="text-[11px] text-slate-400 light:text-slate-500">
                Understanding Copernicus regional models, the CPCB 500 ceiling, and hyper-local sensors
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-sky-400 font-semibold shrink-0">
            <span>{showScaleExplainer ? 'Hide Science' : 'Read Science'}</span>
            {showScaleExplainer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showScaleExplainer && (
          <div className="mt-4 pt-4 border-t border-sky-500/20 text-xs space-y-3 leading-relaxed text-slate-300 light:text-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200">
                <strong className="text-sky-400 block mb-1">1. Regional Chemistry Model</strong>
                <p className="text-[11px] text-slate-400 light:text-slate-600 leading-relaxed">
                  AirIQ ingests verified data from the <strong>European Copernicus Atmospheric Chemistry Model (CAMS)</strong> at an 11 km regional resolution, capturing the ambient background air basin across Delhi NCR.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200">
                <strong className="text-amber-400 block mb-1">2. Statutory 500 Scale Ceiling</strong>
                <p className="text-[11px] text-slate-400 light:text-slate-600 leading-relaxed">
                  By official environmental law, India&apos;s <strong>CPCB National AQI</strong> and the <strong>US EPA scale</strong> mathematically <strong>terminate at 500</strong> (&quot;Hazardous / Severe&quot;). Official government portals never report index figures above 500.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200">
                <strong className="text-rose-400 block mb-1">3. Uncapped Private Spikes</strong>
                <p className="text-[11px] text-slate-400 light:text-slate-600 leading-relaxed">
                  Apps like Swiss IQAir extrapolate the mathematical formula indefinitely without an upper ceiling. Street-corner laser monitors near bus terminals or open waste burning register acute localized particulate spikes exceeding 1,000+.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Observatory Grid: Radial Instrument + Weather Dynamics & Advisories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AQI Circular Instrument (5 cols) */}
        <div className="lg:col-span-5">
          <AqiGauge
            aqi={data.aqi}
            category={category}
            standard={standard}
            dominant={data.dominant}
            badge={data.badge}
          />
        </div>

        {/* Right Column: Weather Dynamics, UV Spectrometry & Health Guidance (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
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
          <div className="p-5 sm:p-6 bg-slate-900/90 light:bg-white rounded-3xl border border-slate-800/90 light:border-slate-200/90 shadow-xl backdrop-blur-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 light:border-slate-200/80">
              <h4 className="text-sm font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                Live Health & Clinical Activity Advisory
              </h4>
              <span className="text-[10px] font-mono text-slate-400 light:text-slate-500">
                BASED ON {category.name.toUpperCase()} AIR
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[11px] font-medium">Outdoor Exercise</span>
                <strong
                  className={`text-sm block ${
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

              <div className="p-3 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[11px] font-medium">Ventilation</span>
                <strong
                  className={`text-sm block ${
                    category.windowOpen ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {category.windowOpen ? 'Windows Open' : 'Keep Shut'}
                </strong>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[11px] font-medium">N95 Respirator</span>
                <strong
                  className={`text-sm block ${
                    category.maskRecommended ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {category.maskRecommended ? 'Recommended' : 'Not Required'}
                </strong>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200/80 space-y-1">
                <span className="text-slate-400 block text-[11px] font-medium">Sensitive Cohorts</span>
                <strong
                  className={`text-sm block ${
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

            {/* Clean Air Zone Finder CTA */}
            <div
              onClick={onNavigateToMap}
              className="cursor-pointer p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-300 light:text-emerald-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Searching for cleaner atmospheric air? Open the <strong>Interactive Air Quality Map</strong> to view nearby green zones and wind vectors.
                </span>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Atmospheric Trajectory & Spike Analysis */}
      <div className="p-5 sm:p-6 bg-slate-900/90 light:bg-white rounded-3xl border border-slate-800/90 light:border-slate-200/90 shadow-xl backdrop-blur-xl">
        <AqiSparkline
          data={data.sparkline}
          currentAqi={data.aqi}
          standard={standard}
          city={data.city}
          lat={data.coordinates.lat}
          lng={data.coordinates.lng}
        />
      </div>

      {/* Spectrometric Pollutant Chemistry Matrix (6 Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
              Spectrometric Pollutant Chemistry
            </h2>
            <p className="text-xs text-slate-400 light:text-slate-500">
              Continuous mass concentrations benchmarked against World Health Organization (WHO) 2021 air quality thresholds
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
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
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-sky-950/60 light:from-indigo-50 light:to-sky-50 border border-indigo-500/30 light:border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5 border border-indigo-500/20">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 light:text-indigo-600">
                AirIQ AI Atmospheric Intelligence Dispatch
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                GEMINI 3.8 REASONING
              </span>
            </div>
            <p className="text-xs text-slate-300 light:text-slate-700 mt-1 leading-relaxed max-w-3xl">
              {loadingAi ? 'Synthesizing atmospheric indicators, meteorological vectors, and health recommendations...' : aiInsight}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAiAssistant}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 transition-all shadow-md shadow-indigo-600/25 active:scale-95 min-h-[44px] touch-manipulation"
        >
          Consult AI Assistant <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
