import React from 'react';
import { Thermometer, Droplets, Wind } from 'lucide-react';

interface WeatherWidgetProps {
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  temperature,
  humidity,
  windSpeed,
}) => {
  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/60 light:bg-slate-50 rounded-xl border border-slate-800 light:border-slate-200">
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
    </div>
  );
};
