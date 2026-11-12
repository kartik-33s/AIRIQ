import React from 'react';
import { AqiCategoryInfo, AqiStandard } from '../lib/aqi';
import { Wind, ShieldCheck, AlertCircle, Activity, Heart, Eye } from 'lucide-react';

interface AqiGaugeProps {
  aqi: number;
  category: AqiCategoryInfo;
  standard: AqiStandard;
  dominant: string | null;
  badge: 'Measured' | 'Modeled estimate' | 'Forecast';
}

export const AqiGauge: React.FC<AqiGaugeProps> = ({
  aqi,
  category,
  standard,
  dominant,
  badge,
}) => {
  // Semi-circle gauge (180 degrees)
  const radius = 94;
  const strokeWidth = 14;
  const circumference = Math.PI * radius;
  // AQI max scale 500
  const normalizedAqi = Math.min(500, Math.max(0, aqi));
  const progressRatio = normalizedAqi / 500;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const getDominantLabel = (d: string | null) => {
    if (!d) return 'PM2.5';
    const map: Record<string, string> = {
      pm25: 'PM2.5 (Fine Inhalable Particles)',
      pm10: 'PM10 (Respirable Dust)',
      no2: 'NO₂ (Nitrogen Dioxide)',
      so2: 'SO₂ (Sulfur Dioxide)',
      o3: 'O₃ (Ground-Level Ozone)',
      co: 'CO (Carbon Monoxide)',
    };
    return map[d.toLowerCase()] || d.toUpperCase();
  };

  // Spectrum segments for background reference track
  const segments = [
    { label: 'Good', limit: 50, color: '#10b981' },
    { label: 'Moderate', limit: 100, color: '#f59e0b' },
    { label: 'Unhealthy (SG)', limit: 150, color: '#f97316' },
    { label: 'Unhealthy', limit: 200, color: '#ef4444' },
    { label: 'Very Unhealthy', limit: 300, color: '#8b5cf6' },
    { label: 'Hazardous', limit: 500, color: '#881337' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-between p-6 sm:p-7 bg-slate-900/90 light:bg-white rounded-3xl border border-slate-800/90 light:border-slate-200/90 shadow-2xl backdrop-blur-xl overflow-hidden h-full group">
      {/* Ambient Atmospheric Chromatic Glow */}
      <div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 pointer-events-none blur-3xl transition-all duration-700"
        style={{ backgroundColor: category.color }}
      />
      <div
        className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full opacity-10 pointer-events-none blur-3xl transition-all duration-700"
        style={{ backgroundColor: category.color }}
      />

      {/* Top Header & Telemetry Origin */}
      <div className="w-full flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${
              badge === 'Measured'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
            }`}
          >
            {badge === 'Measured' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-sky-400" />
            )}
            {badge} Telemetry
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono text-slate-400 light:text-slate-500">
            Standard: <strong className="text-slate-200 light:text-slate-800 font-bold">{standard === 'US_EPA' ? 'US EPA' : 'CPCB India'}</strong>
          </span>
        </div>
      </div>

      {/* Hero Circular Instrument Arc */}
      <div className="relative w-72 h-44 my-4 flex items-center justify-center overflow-visible z-10">
        <svg
          viewBox="0 0 240 135"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={`AQI Gauge showing ${aqi} - ${category.name}`}
        >
          <defs>
            <linearGradient id="gaugeActiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="65%" stopColor="#ef4444" />
              <stop offset="100%" stopColor={category.color} />
            </linearGradient>
            <filter id="gaugeArcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={category.color} floodOpacity="0.55" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 26 122 A 94 94 0 0 1 214 122"
            fill="none"
            stroke="currentColor"
            className="text-slate-800/80 light:text-slate-200"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Calibrated Tick Marks along arc */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((t, idx) => {
            const angle = Math.PI - t * Math.PI;
            const rInner = radius - 14;
            const rOuter = radius - 7;
            const x1 = 120 + rInner * Math.cos(angle);
            const y1 = 122 - rInner * Math.sin(angle);
            const x2 = 120 + rOuter * Math.cos(angle);
            const y2 = 122 - rOuter * Math.sin(angle);
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#64748b"
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={0.4}
              />
            );
          })}

          {/* Active Colored Arc */}
          <path
            d="M 26 122 A 94 94 0 0 1 214 122"
            fill="none"
            stroke="url(#gaugeActiveGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#gaugeArcGlow)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Leading Value Glow Needle Bead */}
          {normalizedAqi > 0 && (
            <circle
              cx={120 - radius * Math.cos(progressRatio * Math.PI)}
              cy={122 - radius * Math.sin(progressRatio * Math.PI)}
              r={strokeWidth / 2 - 1}
              fill="#ffffff"
              filter="drop-shadow(0 0 4px rgba(255,255,255,0.9))"
              className="transition-all duration-1000 ease-out"
            />
          )}
        </svg>

        {/* Center Dynamic Numeric Display */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center">
          <span
            className="text-6xl sm:text-7xl font-black tracking-tight tabular-nums transition-colors drop-shadow-sm"
            style={{ color: category.color }}
          >
            {aqi}
          </span>
          <span className="text-[11px] uppercase tracking-widest font-bold text-slate-400 light:text-slate-500 -mt-1">
            Air Quality Index
          </span>
        </div>
      </div>

      {/* Status Severity Banner */}
      <div className="w-full z-10 space-y-3">
        <div
          className="w-full py-2 px-4 rounded-2xl text-center border transition-all shadow-sm"
          style={{
            backgroundColor: `${category.color}18`,
            borderColor: `${category.color}40`,
            color: category.color,
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm font-black uppercase tracking-wider">
              {category.name}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 light:text-slate-700 mt-0.5 leading-snug">
            {category.generalAdvice}
          </p>
        </div>

        {/* Dominant Pollutant & Exposure Risk */}
        <div className="p-3 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800/80 light:border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
              <Wind className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-[10px] uppercase font-mono text-slate-400 light:text-slate-500 block">
                Dominant Hazard
              </span>
              <strong className="text-slate-100 light:text-slate-900 font-semibold truncate block">
                {getDominantLabel(dominant)}
              </strong>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-mono text-slate-400 light:text-slate-500 block">
              Scale Cap
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-300 light:text-slate-700">
              0 – 500 AQI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
