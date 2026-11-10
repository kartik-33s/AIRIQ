import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  ShieldAlert,
  Clock,
  Zap,
  Info,
  Sparkles,
  Glasses,
  Flame,
} from 'lucide-react';
import { UvData } from '../types/aqi';

interface UvWidgetProps {
  uv: UvData | undefined;
  lat?: number;
  lng?: number;
  city: string;
  aqi?: number;
}

export const UvWidget: React.FC<UvWidgetProps> = ({ uv: initialUv, lat, lng, city, aqi }) => {
  const [uvData, setUvData] = useState<UvData | undefined>(initialUv);
  const [loading, setLoading] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);

  useEffect(() => {
    if (initialUv) {
      setUvData(initialUv);
      return;
    }

    if (lat !== undefined && lng !== undefined) {
      let isCancelled = false;
      setLoading(true);

      fetch(`/api/aqi/uv?lat=${lat}&lng=${lng}`)
        .then((r) => r.json())
        .then((data) => {
          if (!isCancelled && data && data.uvIndex !== undefined) {
            setUvData(data);
          }
          if (!isCancelled) setLoading(false);
        })
        .catch(() => {
          if (!isCancelled) setLoading(false);
        });

      return () => {
        isCancelled = true;
      };
    }
  }, [initialUv, lat, lng, city]);

  const uv = uvData;

  const uvValue = uv ? uv.uvIndex : 0;
  const isDay = uv ? uv.isDay : true;
  const category = uv ? uv.category : 'Low';
  const color = uv ? uv.color : '#10b981';
  const solarRadiation = uv?.solarRadiation ?? null;
  const maxUv = uv?.maxUvToday ?? uvValue;
  const burnTime = uv?.burnTimeMinutes ?? 60;
  const advice = uv?.protectionAdvice ?? 'Minimal sun hazard.';
  const spf = uv?.spfRecommendation ?? 'SPF 15+';

  // Dual environmental stress check: high particulate/smog + high UV
  const isDualStress = (aqi ?? 0) >= 150 && uvValue >= 6.0;

  // Segment index: 0 = Low (0-2), 1 = Moderate (3-5), 2 = High (6-7), 3 = Very High (8-10), 4 = Extreme (11+)
  const activeSegmentIndex =
    uvValue < 3 ? 0 : uvValue < 6 ? 1 : uvValue < 8 ? 2 : uvValue < 11 ? 3 : 4;

  const segments = [
    { label: 'Low', range: '0–2', color: '#10b981' },
    { label: 'Moderate', range: '3–5', color: '#eab308' },
    { label: 'High', range: '6–7', color: '#f97316' },
    { label: 'Very High', range: '8–10', color: '#ef4444' },
    { label: 'Extreme', range: '11+', color: '#a855f7' },
  ];

  return (
    <div className="p-5 bg-slate-900/80 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 shadow-sm transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 rounded-lg flex items-center justify-center transition-colors"
              style={{ backgroundColor: `${color}20`, color: color }}
            >
              {isDay ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </div>
            <h4 className="text-sm font-bold text-slate-100 light:text-slate-900 flex items-center gap-1.5">
              Solar UV Index & Radiation
            </h4>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors uppercase tracking-wider"
              style={{
                backgroundColor: `${color}18`,
                color: color,
                borderColor: `${color}40`,
              }}
            >
              {category}
            </span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-500 pl-8">
            Real-time solar irradiance & skin exposure risk for {city}
          </p>
        </div>

        {/* Big UV Value Callout */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span
                className="text-2xl sm:text-3xl font-black font-mono tracking-tight"
                style={{ color }}
              >
                {loading ? '--' : uvValue.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ 12+</span>
            </div>
            <span className="text-[10px] text-slate-400 light:text-slate-500 block">
              {isDay ? 'Active Daylight' : 'Nighttime (Zero UV)'}
            </span>
          </div>
        </div>
      </div>

      {/* Segmented UV Scale Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="grid grid-cols-5 gap-1.5">
          {segments.map((seg, idx) => {
            const isActive = idx === activeSegmentIndex;
            return (
              <div key={seg.label} className="space-y-1">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'ring-2 ring-offset-2 ring-offset-slate-900 light:ring-offset-white opacity-100 shadow-sm'
                      : 'opacity-30'
                  }`}
                  style={{
                    backgroundColor: seg.color,
                    borderColor: isActive ? seg.color : 'transparent',
                  }}
                />
                <div className="flex justify-between items-center px-0.5 text-[9px] text-slate-400">
                  <span className={`font-medium ${isActive ? 'font-bold' : ''}`} style={{ color: isActive ? seg.color : undefined }}>
                    {seg.label}
                  </span>
                  <span className="opacity-60 hidden sm:inline font-mono">{seg.range}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Telemetry & Health Risk Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Metric 1: Est. Safe Burn Time */}
        <div className="p-3 rounded-xl bg-slate-800/40 light:bg-slate-50 border border-slate-700/40 light:border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Est. Burn Time</span>
          </div>
          <div className="text-sm font-bold text-slate-100 light:text-slate-900 font-mono">
            {!isDay || uvValue < 0.1 ? '> 2 hours' : `~${burnTime} mins`}
          </div>
          <span className="text-[10px] text-slate-400 light:text-slate-500 block">
            Unprotected skin threshold
          </span>
        </div>

        {/* Metric 2: Solar Irradiance */}
        <div className="p-3 rounded-xl bg-slate-800/40 light:bg-slate-50 border border-slate-700/40 light:border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px]">Solar Radiation</span>
          </div>
          <div className="text-sm font-bold text-slate-100 light:text-slate-900 font-mono">
            {solarRadiation !== null ? `${solarRadiation} W/m²` : isDay ? 'Moderate' : '0 W/m²'}
          </div>
          <span className="text-[10px] text-slate-400 light:text-slate-500 block">
            Direct shortwave flux
          </span>
        </div>

        {/* Metric 3: Peak UV Today */}
        <div className="p-3 rounded-xl bg-slate-800/40 light:bg-slate-50 border border-slate-700/40 light:border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px]">Peak UV Today</span>
          </div>
          <div className="text-sm font-bold text-slate-100 light:text-slate-900 font-mono">
            {maxUv.toFixed(1)} UV
          </div>
          <span className="text-[10px] text-slate-400 light:text-slate-500 block">
            Daily maximum intensity
          </span>
        </div>

        {/* Metric 4: Protection Guidance */}
        <div className="p-3 rounded-xl bg-slate-800/40 light:bg-slate-50 border border-slate-700/40 light:border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Glasses className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Protection</span>
          </div>
          <div className="text-sm font-bold text-slate-100 light:text-slate-900">
            {spf}
          </div>
          <span className="text-[10px] text-slate-400 light:text-slate-500 block">
            {uvValue >= 6 ? 'Hat & UV400 glasses' : 'Normal precaution'}
          </span>
        </div>
      </div>

      {/* Advisory & Dual Environmental Stress Banner */}
      {isDualStress ? (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 light:text-rose-700">
          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="block font-bold">Dual Atmospheric Stress Detected</strong>
            <p className="text-[11px] text-rose-200/90 light:text-rose-600 leading-relaxed">
              Elevated particulate pollution (AQI {aqi}) is coinciding with high solar UV radiation ({uvValue}). High ultraviolet flux catalyzes photochemical ozone (O₃) synthesis from vehicular emissions. Avoid prolonged midday workouts.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-800/40 light:bg-slate-50 border border-slate-700/40 light:border-slate-200 flex items-start justify-between gap-2.5 text-xs">
          <div className="flex items-start gap-2 text-slate-300 light:text-slate-600">
            <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong className="text-slate-200 light:text-slate-800 font-semibold">Sun Safety Advisory: </strong>
              {advice}
            </p>
          </div>
          <button
            onClick={() => setShowHealthModal(!showHealthModal)}
            className="text-[10px] font-semibold text-sky-400 hover:text-sky-300 whitespace-nowrap self-center flex items-center gap-1 transition-colors"
          >
            <span>{showHealthModal ? 'Hide Science' : 'UV & Smog Synergy'}</span>
          </button>
        </div>
      )}

      {/* Educational Collapsible: Photochemical Smog Synergy */}
      {showHealthModal && (
        <div className="p-3.5 rounded-xl bg-sky-950/20 light:bg-sky-50 border border-sky-500/20 text-xs text-slate-300 light:text-slate-700 space-y-2 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-sky-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>How Solar Radiation Drives Urban Smog</span>
          </div>
          <p className="text-[11px] text-slate-400 light:text-slate-600">
            Solar shortwave ultraviolet radiation is the primary chemical catalyst behind <strong>photochemical smog</strong>. When sunlight strikes nitrogen dioxide (NO₂) emitted by vehicle exhausts and volatile organic compounds (VOCs), ultraviolet photons split the molecules to form aggressive <strong>ground-level ozone (O₃)</strong>, peaking during sunny afternoons.
          </p>
        </div>
      )}
    </div>
  );
};
