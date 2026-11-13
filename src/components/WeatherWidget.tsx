import React from 'react';
import { Thermometer, Droplets, Wind, Sun, Compass, Gauge } from 'lucide-react';

interface WeatherWidgetProps {
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  uvIndex?: number | null;
  uvCategory?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  temperature,
  humidity,
  windSpeed,
  uvIndex,
  uvCategory,
}) => {
  // Approximate feels like temperature based on humidity
  const feelsLike =
    temperature !== null
      ? humidity !== null && humidity > 60
        ? Math.round(temperature + (humidity - 60) * 0.1)
        : Math.round(temperature)
      : null;

  // Derive wind force description (Beaufort scale approximation)
  const getWindForce = (speed: number | null) => {
    if (speed === null) return 'Nominal';
    if (speed < 5) return 'Calm';
    if (speed < 15) return 'Light Breeze';
    if (speed < 30) return 'Moderate Breeze';
    if (speed < 50) return 'Strong Breeze';
    return 'Gale Force';
  };

  // Derive air comfort
  const getHumidityComfort = (hum: number | null) => {
    if (hum === null) return 'Nominal';
    if (hum < 30) return 'Arid Dry';
    if (hum <= 60) return 'Optimal Comfort';
    if (hum <= 80) return 'Humid Air';
    return 'Saturated';
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-900/90 light:bg-white rounded-3xl border border-slate-800/90 light:border-slate-200/90 shadow-xl backdrop-blur-xl space-y-4">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 light:border-slate-200/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400 shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-100 light:text-slate-900">
              Atmospheric Dynamics & Microclimate
            </h3>
            <span className="text-[10px] text-slate-400 light:text-slate-500 block">
              Surface meteorological parameters influencing aerosol dispersion
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700 shrink-0 whitespace-nowrap">
          SURFACE VECTORS
        </span>
      </div>

      {/* Grid of Microclimate Dynamics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Temperature */}
        <div className="min-w-0 p-3 sm:p-3.5 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between gap-1 text-slate-400">
            <span className="text-[11px] font-medium truncate">Ambient Temp</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-100 light:text-slate-900 tabular-nums">
              {temperature !== null ? `${Math.round(temperature)}°` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400">C</span>
          </div>
          <span className="text-[10px] text-slate-400 light:text-slate-500 block truncate">
            Feels like {feelsLike !== null ? `${feelsLike}°C` : 'N/A'}
          </span>
        </div>

        {/* Metric 2: Relative Humidity */}
        <div className="min-w-0 p-3 sm:p-3.5 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between gap-1 text-slate-400">
            <span className="text-[11px] font-medium truncate">Air Moisture</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-100 light:text-slate-900 tabular-nums">
              {humidity !== null ? `${Math.round(humidity)}%` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400">RH</span>
          </div>
          <span className="text-[10px] text-slate-400 light:text-slate-500 block truncate">
            {getHumidityComfort(humidity)}
          </span>
        </div>

        {/* Metric 3: Wind Vector Velocity */}
        <div className="min-w-0 p-3 sm:p-3.5 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between gap-1 text-slate-400">
            <span className="text-[11px] font-medium truncate">Wind Dispersion</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Wind className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-100 light:text-slate-900 tabular-nums">
              {windSpeed !== null ? `${Math.round(windSpeed)}` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400">km/h</span>
          </div>
          <span className="text-[10px] text-slate-400 light:text-slate-500 block truncate">
            {getWindForce(windSpeed)}
          </span>
        </div>

        {/* Metric 4: Solar UV Radiation */}
        <div className="min-w-0 p-3 sm:p-3.5 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between gap-1 text-slate-400">
            <span className="text-[11px] font-medium truncate">Solar Radiance</span>
            <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 shrink-0">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-100 light:text-slate-900 tabular-nums">
              {uvIndex !== undefined && uvIndex !== null ? uvIndex.toFixed(1) : 'N/A'}
            </span>
            <span className="text-xs text-slate-400">UVI</span>
          </div>
          <span className="text-[10px] text-slate-400 light:text-slate-500 block truncate">
            {uvCategory || 'Moderate Risk'}
          </span>
        </div>
      </div>
    </div>
  );
};
