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
  Award,
  Flame,
  Check,
  Plus,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { LocationData, AqiStandard } from '../types/aqi';
import { getAqiCategory, formatRelativeTime } from '../lib/aqi';
import { AqiGauge } from '../components/AqiGauge';
import { PollutantCard } from '../components/PollutantCard';
import { WeatherWidget } from '../components/WeatherWidget';
import { AqiSparkline } from '../components/AqiSparkline';
import { UvWidget } from '../components/UvWidget';
import { useChampionProfile } from '../lib/useChampionProfile';
import { useAmbientSoundscape } from '../lib/useAmbientSoundscape';
import { CommunityReportModal } from '../components/CommunityReportModal';

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
  onNavigateToChampion?: () => void;
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
  onNavigateToChampion,
}) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showScaleExplainer, setShowScaleExplainer] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { profile, logHabit, submitReport } = useChampionProfile();
  const { isPlaying: isSoundPlaying, activeProfileName: soundProfileName, toggle: toggleSound } =
    useAmbientSoundscape(data?.aqi);

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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* City Chips & Geolocation Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/60 light:border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto -mx-1 px-1">
          <button
            onClick={onUseCurrentLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold hover:bg-sky-500/20 whitespace-nowrap transition-colors disabled:opacity-70 min-h-[36px] touch-manipulation shrink-0"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-400' : ''}`} />
            {isLocating ? 'Locating GPS...' : 'My Location'}
          </button>
          <span className="text-slate-600 text-xs hidden sm:inline">|</span>
          {popularCities.map((city, idx) => (
            <button
              key={`chip-city-${city}-${idx}`}
              onClick={() => onSelectCity(city)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap shrink-0 min-h-[36px] touch-manipulation ${
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
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-400 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/40">
          <label className="flex items-center gap-2 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 text-sky-500 focus:ring-0 w-4 h-4"
            />
            <span className="text-[11px]">Auto-refresh (5m)</span>
          </label>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 light:bg-slate-200 text-slate-200 light:text-slate-800 hover:bg-slate-700 transition-colors text-xs font-medium min-h-[36px] touch-manipulation"
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


      {/* 3D Atmospheric Digital Twin Launcher Banner */}
      {onNavigateTo3D && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-cyan-950/30 to-indigo-950/40 light:from-sky-50 light:to-indigo-50 border border-sky-500/30 light:border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-sky-950/20">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 flex-shrink-0 mt-0.5 border border-sky-500/30">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 light:text-sky-600">
                  Three.js 3D Atmospheric Digital Twin
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono font-bold">
                  INTERACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-300 light:text-slate-700 mt-1 leading-relaxed">
                Experience real-time particulate dispersion, 10-part procedural sensor station with exploded telemetry, dynamic solar azimuth, and city-scale smog depth.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateTo3D}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 flex-shrink-0 transition-all shadow-md shadow-sky-500/25 active:scale-95 min-h-[40px] touch-manipulation"
          >
            Launch 3D Scene <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1000+ vs 500 Scale & Live Model Transparency Accordion */}
      <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 light:bg-sky-50/70 p-4 transition-all">
        <button
          onClick={() => setShowScaleExplainer(!showScaleExplainer)}
          className="w-full flex items-center justify-between text-left gap-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 flex-shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 light:text-slate-900 block">
                Why does Google / IQAir show 1,000+ AQI in Delhi while official standards show ~200–500?
              </span>
              <span className="text-[11px] text-slate-400 light:text-slate-500">
                Understanding live numerical models, the official CPCB 500 ceiling, and hyper-local sensors
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-sky-400 font-medium flex-shrink-0">
            <span>{showScaleExplainer ? 'Hide Details' : 'Read Science'}</span>
            {showScaleExplainer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showScaleExplainer && (
          <div className="mt-3.5 pt-3.5 border-t border-sky-500/20 text-xs space-y-3 leading-relaxed text-slate-300 light:text-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 light:bg-white border border-slate-800 light:border-slate-200">
                <strong className="text-sky-400 block mb-1">1. Live Verified Model</strong>
                <p className="text-[11px] text-slate-400 light:text-slate-600">
                  AirIQ fetches live hourly data from the <strong>European Copernicus Atmospheric Chemistry Model (CAMS)</strong> at an 11 km regional resolution, capturing the ambient background across Delhi NCR.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 light:bg-white border border-slate-800 light:border-slate-200">
                <strong className="text-amber-400 block mb-1">2. Official 500 Cap</strong>
                <p className="text-[11px] text-slate-400 light:text-slate-600">
                  By regulatory law, India's <strong>CPCB National AQI</strong> and the <strong>US EPA scale</strong> mathematically <strong>terminate at 500</strong> (&quot;Severe / Hazardous&quot;). Official government portals never report index values above 500.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 light:bg-white border border-slate-800 light:border-slate-200">
                <strong className="text-rose-400 block mb-1">3. IQAir Uncapped Spikes</strong>
                <p className="text-[11px] text-slate-400 light:text-slate-600">
                  Private apps like Swiss IQAir extrapolate the mathematical formula without an upper cap. Street-corner laser monitors at hotspots like Anand Vihar (beside bus terminals or open burning) detect acute localized spikes that produce 1,000+ readings.
                </p>
              </div>
            </div>
          </div>
        )}
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

        {/* Right Column: Weather, UV & Activity Guidelines (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Weather Widget with UV Pill */}
          <WeatherWidget
            temperature={data.weather.temperature}
            humidity={data.weather.humidity}
            windSpeed={data.weather.windSpeed}
            uvIndex={data.uv?.uvIndex}
            uvCategory={data.uv?.category}
          />

          {/* Solar UV Index & Radiation Health Risk Widget */}
          <UvWidget
            uv={data.uv}
            lat={data.coordinates.lat}
            lng={data.coordinates.lng}
            city={data.city}
            aqi={data.aqi}
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

          {/* Ambient Soundscape Live Widget */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 light:bg-white border border-slate-800/80 light:border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl transition-colors ${
                  isSoundPlaying
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 light:bg-slate-100 text-slate-400'
                }`}
              >
                {isSoundPlaying ? (
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 light:text-slate-900">
                    Ambient Nature Soundscape
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 light:bg-slate-100 text-emerald-400 font-mono">
                    {soundProfileName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 light:text-slate-500 mt-0.5">
                  {isSoundPlaying
                    ? 'Calming nature audio playing based on live air quality'
                    : `Procedural nature sounds reflecting ${data.city}'s current air quality`}
                </p>
              </div>
            </div>
            <button
              onClick={toggleSound}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation min-h-[34px] flex-shrink-0 ${
                isSoundPlaying
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
              }`}
            >
              {isSoundPlaying ? 'Mute Sound' : 'Play Soundscape'}
            </button>
          </div>
        </div>
      </div>

      {/* 24-Hour AQI Sparkline Fluctuations */}
      <AqiSparkline
        data={data.sparkline}
        currentAqi={data.aqi}
        standard={standard}
        city={data.city}
        lat={data.coordinates.lat}
        lng={data.coordinates.lng}
      />

      {/* Clean Air Champion Citizen Action & Rewards Hub */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 light:from-slate-50 light:to-amber-50/50 border border-amber-500/30 light:border-amber-200 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
              {profile.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Clean Air Champion
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 light:bg-slate-200 text-slate-200 light:text-slate-800">
                  {profile.rankTier} · Lvl {profile.level}
                </span>
              </div>
              <p className="text-xs text-slate-300 light:text-slate-600 mt-0.5">
                Earn badges and XP by reporting local pollution hazards and maintaining low-emission habits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 light:bg-slate-100 border border-slate-700/60 light:border-slate-200 text-xs">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span className="font-bold text-slate-100 light:text-slate-900 font-mono">
                {profile.currentStreak}d Streak
              </span>
            </div>
            {onNavigateToChampion && (
              <button
                onClick={onNavigateToChampion}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold flex items-center gap-1 transition-colors min-h-[36px] touch-manipulation"
              >
                <span>View Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick action bar */}
        <div className="pt-2 border-t border-slate-800/60 light:border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500">
              Today's Quick Check-in:
            </span>
            {profile.dailyHabits.slice(0, 3).map((habit) => {
              const isDone = habit.completedToday;
              return (
                <button
                  key={habit.id}
                  onClick={() => logHabit(habit.id, data.city)}
                  disabled={isDone}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all touch-manipulation min-h-[30px] ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 light:bg-slate-100 light:text-slate-700 active:scale-95'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3 text-sky-400" />}
                  <span>{habit.name.split(' ')[0]} {habit.name.split(' ')[1]}</span>
                  <span className="text-[10px] text-amber-400 font-mono">+{habit.xp}XP</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 touch-manipulation min-h-[30px]"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Smoke / Dust</span>
          </button>
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
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 flex-shrink-0 transition-colors shadow-sm min-h-[40px] touch-manipulation"
        >
          Consult AI <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Community Report Modal */}
      <CommunityReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentLocation={data}
        onSubmitReport={(reportData) => {
          submitReport(reportData);
          if (onNavigateToChampion) {
            onNavigateToChampion();
          }
        }}
      />
    </div>
  );
};
