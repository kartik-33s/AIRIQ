import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  Sun,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronRight,
  Activity,
} from 'lucide-react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { LocationData, ForecastPoint, DailyForecast, AqiStandard } from '../types/aqi';
import { getAqiCategory, formatRelativeTime } from '../lib/aqi';

interface ForecastViewProps {
  currentLocation: LocationData | null;
  standard: AqiStandard;
}

export const ForecastView: React.FC<ForecastViewProps> = ({ currentLocation, standard }) => {
  const [hourly, setHourly] = useState<ForecastPoint[]>([]);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (!currentLocation) return;
    setLoading(true);
    fetch(
      `/api/aqi/forecast?lat=${currentLocation.coordinates.lat}&lng=${currentLocation.coordinates.lng}&standard=${standard}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.hourly) setHourly(data.hourly);
        if (data.daily) {
          setDaily(data.daily);
          if (data.daily[0]) setSelectedDay(data.daily[0].date);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentLocation?.city, standard]);

  if (loading && hourly.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-8 bg-slate-800 light:bg-slate-200 rounded w-1/4" />
        <div className="h-80 bg-slate-800 light:bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-800 light:bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Format hourly chart data (limit to next 48 hours)
  const chartData = hourly.slice(0, 48).map((pt) => {
    const d = new Date(pt.time);
    const hourLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dayLabel = d.toLocaleDateString([], { weekday: 'short' });
    return {
      label: `${dayLabel} ${hourLabel}`,
      time: pt.time,
      aqi: pt.aqi,
      confidenceLower: pt.confidenceLower,
      confidenceUpper: pt.confidenceUpper,
      confidenceRange: [pt.confidenceLower, pt.confidenceUpper],
      pm25: pt.pm25,
      isPast: pt.isPast,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 light:border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 light:text-slate-900 tracking-tight">
              Predictive AQI Forecast (48h & 7-Day)
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Atmospheric dispersion modeling and simulated particulate trajectories for{' '}
            <strong className="text-slate-200 light:text-slate-700">{currentLocation?.city}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Open-Meteo Modeled Forecast
          </span>
        </div>
      </div>

      {/* Hourly 48-Hour Forecast Chart Card */}
      <div className="p-4 sm:p-6 bg-slate-900/80 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              48-Hour Hourly Trajectory with Shaded Confidence Envelope
            </h3>
            <p className="text-xs text-slate-400">
              Dashed line represents modeled expectation; shaded area captures meteorological uncertainty.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-sky-400" />
              <span>Forecast Trend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-500/20 border border-sky-500/40" />
              <span>Confidence Interval (±σ)</span>
            </div>
          </div>
        </div>

        {/* Recharts Chart */}
        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} interval={4} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 'auto']} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    const cat = getAqiCategory(item.aqi, standard);
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 text-white">
                        <p className="font-bold text-slate-300">{item.label}</p>
                        <p className="text-sm font-black" style={{ color: cat.color }}>
                          Expected AQI: {item.aqi} ({cat.name})
                        </p>
                        <p className="text-slate-400">
                          Confidence Range: {item.confidenceLower} - {item.confidenceUpper}
                        </p>
                        {item.pm25 !== null && (
                          <p className="text-sky-400">PM2.5: {item.pm25} µg/m³</p>
                        )}
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-sky-300">
                          Modeled Forecast
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={50} stroke="#10b981" strokeDasharray="2 2" />
              <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="2 2" />
              <ReferenceLine y={150} stroke="#f97316" strokeDasharray="2 2" />
              <ReferenceLine y={200} stroke="#ef4444" strokeDasharray="2 2" />

              {/* Shaded Confidence Band */}
              <Area
                type="monotone"
                dataKey="confidenceUpper"
                stroke="transparent"
                fill="url(#confidenceGrad)"
                fillOpacity={1}
              />
              <Area
                type="monotone"
                dataKey="confidenceLower"
                stroke="transparent"
                fill="#0f172a"
                fillOpacity={0.8}
              />

              {/* Dashed Forecast Line */}
              <Line
                type="monotone"
                dataKey="aqi"
                stroke="#38bdf8"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 2, fill: '#38bdf8' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-2 border-t border-slate-800 light:border-slate-200 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Vertical dashed reference lines highlight WHO/EPA safety thresholds.
          </span>
          <span className="font-mono">Updated: {formatRelativeTime(new Date())}</span>
        </div>
      </div>

      {/* 7-Day Daily Forecast Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400" />
            7-Day Outlook & Best Outdoor Windows
          </h3>
          <span className="text-xs text-slate-400">Click a card for day breakdown</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {daily.map((d, idx) => {
            const cat = getAqiCategory(d.avgAqi, standard);
            const dateObj = new Date(d.date);
            const dayName = idx === 0 ? 'Today' : dateObj.toLocaleDateString([], { weekday: 'short' });
            const monthDay = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const isSelected = selectedDay === d.date;

            return (
              <div
                key={d.date}
                onClick={() => setSelectedDay(d.date)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 touch-manipulation select-none ${
                  isSelected
                    ? 'bg-slate-800/90 light:bg-slate-100 border-sky-500 shadow-md scale-[1.02]'
                    : 'bg-slate-900/70 light:bg-white border-slate-800 light:border-slate-200 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-200 light:text-slate-800 block">
                    {dayName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{monthDay}</span>
                </div>

                {/* AQI Pill */}
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] text-slate-400">Avg AQI</span>
                    <span
                      className="text-2xl font-black tabular-nums"
                      style={{ color: cat.color }}
                    >
                      {d.avgAqi}
                    </span>
                  </div>
                  <span
                    className="block text-center text-[10px] font-bold px-2 py-0.5 rounded-full border truncate"
                    style={{
                      backgroundColor: cat.bgColor,
                      borderColor: cat.borderColor,
                      color: cat.color,
                    }}
                  >
                    {cat.name}
                  </span>
                </div>

                {/* Best Window for Outdoor Activity */}
                <div className="pt-2 border-t border-slate-800 light:border-slate-200 text-[10px] space-y-1">
                  <span className="text-emerald-400 font-semibold block flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Best Window:
                  </span>
                  <span className="text-slate-300 light:text-slate-600 leading-tight block">
                    {d.bestTime}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
