import React from 'react';
import { AqiCategoryInfo, AqiStandard } from '../lib/aqi';
import { Wind, ShieldCheck, AlertCircle } from 'lucide-react';

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
  const radius = 90;
  const strokeWidth = 14;
  const circumference = Math.PI * radius;
  // AQI max scale 500
  const normalizedAqi = Math.min(500, Math.max(0, aqi));
  const progressRatio = normalizedAqi / 500;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const getDominantLabel = (d: string | null) => {
    if (!d) return 'PM2.5';
    const map: Record<string, string> = {
      pm25: 'PM2.5 (Fine Particulates)',
      pm10: 'PM10 (Respirable Dust)',
      no2: 'NO₂ (Nitrogen Dioxide)',
      so2: 'SO₂ (Sulfur Dioxide)',
      o3: 'O₃ (Ground-level Ozone)',
      co: 'CO (Carbon Monoxide)',
    };
    return map[d.toLowerCase()] || d.toUpperCase();
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-slate-900/80 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 shadow-xl backdrop-blur-md">
      {/* Top Meta Header */}
      <div className="w-full flex items-center justify-between gap-2 mb-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border ${
            badge === 'Measured'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
          }`}
        >
          {badge === 'Measured' ? (
            <ShieldCheck className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          {badge}
        </span>
        <span className="text-xs font-medium text-slate-400 light:text-slate-500">
          Standard: <strong className="text-slate-200 light:text-slate-800">{standard === 'US_EPA' ? 'US EPA' : 'India CPCB'}</strong>
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative w-64 h-36 flex items-center justify-center overflow-visible">
        <svg
          viewBox="0 0 220 120"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={`AQI Gauge showing ${aqi} - ${category.name}`}
        >
          {/* Background Arc */}
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke="currentColor"
            className="text-slate-800 light:text-slate-200"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Colored Arc */}
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke={category.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${category.color}66)`,
            }}
          />
        </svg>

        {/* Center AQI Value */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-extrabold tracking-tight tabular-nums transition-colors"
            style={{ color: category.color }}
          >
            {aqi}
          </span>
          <span className="text-xs uppercase tracking-widest font-semibold text-slate-400 light:text-slate-500">
            Air Quality Index
          </span>
        </div>
      </div>

      {/* Category Pill */}
      <div
        className="mt-4 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide shadow-sm flex items-center gap-2 border"
        style={{
          backgroundColor: category.bgColor,
          borderColor: category.borderColor,
          color: category.color,
        }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: category.color }}
        />
        {category.name}
      </div>

      {/* Dominant Pollutant */}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300 light:text-slate-600 bg-slate-800/60 light:bg-slate-100 px-3 py-1 rounded-lg">
        <Wind className="w-3.5 h-3.5 text-slate-400" />
        <span>Main Pollutant:</span>
        <strong className="text-slate-100 light:text-slate-900 font-semibold">
          {getDominantLabel(dominant)}
        </strong>
      </div>

      {/* Plain Language Summary */}
      <p className="mt-3 text-center text-xs sm:text-sm text-slate-300 light:text-slate-600 max-w-sm leading-relaxed">
        {category.generalAdvice}
      </p>
    </div>
  );
};
