import React from 'react';
import { Thermometer, Droplets, Wind, Sun } from 'lucide-react';

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
  return (
    <div className={`grid ${uvIndex !== undefined ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-3 p-4 bg-slate-900/60 light:bg-slate-50 rounded-xl border border-slate-800 light:border-slate-200`}>
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-400">
          <Thermometer className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs text-slate-400 light:text-slate-500 block">Temperature</span>
          <span className="text-base font-bold text-slate-100 light:text-slate-900">
            {temperature !== null ? `${Math.round(temperature)}°C` : 'N/A'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400">
          <Droplets className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs text-slate-400 light:text-slate-500 block">Humidity</span>
          <span className="text-base font-bold text-slate-100 light:text-slate-900">
            {humidity !== null ? `${Math.round(humidity)}%` : 'N/A'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400">
          <Wind className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs text-slate-400 light:text-slate-500 block">Wind Speed</span>
          <span className="text-base font-bold text-slate-100 light:text-slate-900">
            {windSpeed !== null ? `${Math.round(windSpeed)} km/h` : 'N/A'}
          </span>
        </div>
      </div>

      {uvIndex !== undefined && (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 light:text-slate-500 block">UV Index</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-100 light:text-slate-900 font-mono">
                {uvIndex !== null ? uvIndex.toFixed(1) : 'N/A'}
              </span>
              {uvCategory && (
                <span className="text-[10px] font-semibold text-amber-400">
                  {uvCategory}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
