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
        <div className="h-8 bg-slate-800 light:bg-slate-200 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-800 light:bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-2 h-80 bg-slate-800 light:bg-slate-200 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800 light:bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-slate-900 light:bg-white rounded-2xl border border-rose-500/30 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">
          Data Stream Temporarily Unavailable
        </h3>
        <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-xl bg-sky-500 text-white font-semibold text-xs hover:bg-sky-600 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Retry Retrieval
        </button>
      </div>
    );
  }

  if (!data) return null;

  const category = getAqiCategory(data.aqi, standard);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* City Chips & Geolocation Quick Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/60 light:border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={onUseCurrentLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold hover:bg-sky-500/20 whitespace-nowrap transition-colors disabled:opacity-70"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-400' : ''}`} />
            {isLocating ? 'Locating GPS...' : 'My Location'}
          </button>
          <span className="text-slate-600 text-xs hidden sm:inline">|</span>
          {popularCities.map((city, idx) => (
            <button
              key={`chip-city-${city}-${idx}`}
              onClick={() => onSelectCity(city)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                data.city.toLowerCase().includes(city.toLowerCase())
                  ? 'bg-slate-100 text-slate-900 border-white light:bg-slate-900 light:text-white'
                  : 'bg-slate-900/60 light:bg-slate-100 text-slate-300 light:text-slate-600 border-slate-800 light:border-slate-200 hover:border-slate-600'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Refresh & Auto-Refresh Toggle */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 text-sky-500 focus:ring-0"
            />
            <span className="text-[11px]">Auto-refresh (5m)</span>
          </label>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 light:bg-slate-200 text-slate-200 light:text-slate-800 hover:bg-slate-700 transition-colors text-[11px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Update Now</span>
          </button>
        </div>
      </div>

      {/* Location Attribution Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/40 light:bg-slate-50 rounded-2xl border border-slate-800/80 light:border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 light:text-slate-900 tracking-tight">
              {data.city}
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Station: <span className="text-slate-300 light:text-slate-700 font-medium">{data.stationName}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Last reading: </span>
            <strong className="text-slate-200 light:text-slate-800">
              {formatRelativeTime(data.lastUpdated)}
            </strong>
          </div>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <span className="text-slate-400">
            Source: <strong className="text-slate-200 light:text-slate-800">{data.sourceName}</strong>
          </span>
        </div>
      </div>

      {/* AI Intelligence Bulletin */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-sky-950/40 light:from-indigo-50 light:to-sky-50 border border-indigo-500/20 light:border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 light:text-indigo-600">
              AirIQ AI Atmospheric Summary
            </h4>
            <p className="text-xs text-slate-300 light:text-slate-700 mt-0.5 leading-relaxed">
              {loadingAi ? 'Synthesizing atmospheric indicators with Gemini 3.8...' : aiInsight}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAiAssistant}
          className="self-end sm:self-center px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 flex-shrink-0 transition-colors shadow-sm"
        >
          Consult AI <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Grid: AQI Gauge + Weather & Quick Advisories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AQI Radial Gauge (5 cols) */}
        <div className="lg:col-span-5">
          <AqiGauge
            aqi={data.aqi}
            category={category}
            standard={standard}
            dominant={data.dominant}
            badge={data.badge}
          />
        </div>

        {/* Right Column: Weather & Activity Guidelines (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Weather Widget */}
          <WeatherWidget
            temperature={data.weather.temperature}
            humidity={data.weather.humidity}
            windSpeed={data.weather.windSpeed}
          />

          {/* Activity Recommendations Quick Grid */}
          <div className="p-5 bg-slate-900/80 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                Live Health & Activity Advisory
              </h4>
              <span className="text-[11px] text-slate-400">Based on {category.name} Air</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/40 light:border-slate-200">
                <span className="text-slate-400 block text-[11px]">Outdoor Sports</span>
                <strong
                  className={
                    category.outdoorActivity === 'safe'
                      ? 'text-emerald-400'
                      : category.outdoorActivity === 'caution'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }
                >
                  {category.outdoorActivity === 'safe'
                    ? 'Safe'
                    : category.outdoorActivity === 'caution'
                    ? 'Caution'
                    : 'Avoid Exertion'}
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/40 light:border-slate-200">
                <span className="text-slate-400 block text-[11px]">Ventilation</span>
                <strong className={category.windowOpen ? 'text-emerald-400' : 'text-rose-400'}>
                  {category.windowOpen ? 'Windows Open' : 'Keep Shut'}
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/40 light:border-slate-200">
                <span className="text-slate-400 block text-[11px]">Mask (N95)</span>
                <strong className={category.maskRecommended ? 'text-amber-400' : 'text-emerald-400'}>
                  {category.maskRecommended ? 'Recommended' : 'Not Needed'}
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/40 light:border-slate-200">
                <span className="text-slate-400 block text-[11px]">Vulnerable Groups</span>
                <strong className={category.level >= 3 ? 'text-rose-400' : 'text-slate-200 light:text-slate-700'}>
                  {category.level >= 3 ? 'Stay Indoors' : 'Normal Routines'}
                </strong>
              </div>
            </div>

            <p className="text-xs text-slate-300 light:text-slate-600 italic pt-1">
              {category.sensitiveAdvice}
            </p>
          </div>

          {/* Quick Clean Air Finder banner */}
          <div
            onClick={onNavigateToMap}
            className="cursor-pointer p-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-300 light:text-emerald-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Looking for cleaner air? Explore the <strong>Interactive Air Quality Map</strong> to find nearby green zones.
              </span>
            </div>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Pollutant Cards Grid (PM2.5, PM10, NO2, SO2, CO, O3) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-100 light:text-slate-900">
            Monitored Pollutants
          </h3>
          <span className="text-xs text-slate-400">
            Standard: {standard === 'US_EPA' ? 'US EPA' : 'India CPCB'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PollutantCard
            id="pm25"
            name="PM2.5"
            chemicalName="Fine Inhalable Particles"
            value={data.pollutants.pm25}
            unit="µg/m³"
            whoLimit={15}
            standard={standard}
          />
          <PollutantCard
            id="pm10"
            name="PM10"
            chemicalName="Respirable Suspended Dust"
            value={data.pollutants.pm10}
            unit="µg/m³"
            whoLimit={45}
            standard={standard}
          />
          <PollutantCard
            id="no2"
            name="NO₂"
            chemicalName="Nitrogen Dioxide (Vehicular)"
            value={data.pollutants.no2}
            unit="µg/m³"
            whoLimit={25}
            standard={standard}
          />
          <PollutantCard
            id="so2"
            name="SO₂"
            chemicalName="Sulfur Dioxide (Industrial)"
            value={data.pollutants.so2}
            unit="µg/m³"
            whoLimit={40}
            standard={standard}
          />
          <PollutantCard
            id="o3"
            name="O₃"
            chemicalName="Ground-Level Ozone (Smog)"
            value={data.pollutants.o3}
            unit="µg/m³"
            whoLimit={100}
            standard={standard}
          />
          <PollutantCard
            id="co"
            name="CO"
            chemicalName="Carbon Monoxide"
            value={data.pollutants.co}
            unit="mg/m³"
            whoLimit={4.0}
            standard={standard}
          />
        </div>
      </div>
    </div>
  );
};
