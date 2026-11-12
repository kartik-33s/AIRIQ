import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  Calendar,
  RefreshCw,
  Info,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { LocationData, HistoryData, AqiStandard } from '../types/aqi';
import { getAqiCategory, formatRelativeTime } from '../lib/aqi';

interface HistoryViewProps {
  currentLocation: LocationData | null;
  standard: AqiStandard;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ currentLocation, standard }) => {
  const [days, setDays] = useState<number>(30);
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'aqi' | 'particulates'>('aqi');
  const [selectedSpikeDate, setSelectedSpikeDate] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const fetchHistory = (d: number) => {
    if (!currentLocation) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/aqi/history?lat=${currentLocation.coordinates.lat}&lng=${currentLocation.coordinates.lng}&days=${d}&standard=${standard}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (res.error || !res.daily) {
          setError(res.error || 'Failed to load historical data');
        } else {
          setHistoryData(res);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Network error fetching history');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory(days);
  }, [days, currentLocation?.city, standard]);

  if (error && !historyData) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-slate-900 light:bg-white rounded-2xl border border-rose-500/30 text-center space-y-4">
        <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">
          Historical Telemetry Unavailable
        </h3>
        <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">{error}</p>
        <button
          onClick={() => fetchHistory(days)}
          className="px-4 py-2 rounded-xl bg-sky-500 text-white font-semibold text-xs hover:bg-sky-600 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Retry Query
        </button>
      </div>
    );
  }

  if (loading && !historyData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-8 bg-slate-800 light:bg-slate-200 rounded w-1/4" />
        <div className="h-96 bg-slate-800 light:bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-800 light:bg-slate-200 rounded-xl" />
          <div className="h-28 bg-slate-800 light:bg-slate-200 rounded-xl" />
          <div className="h-28 bg-slate-800 light:bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const categoryNow = currentLocation ? getAqiCategory(currentLocation.aqi, standard) : null;
  const isWorsening = (historyData?.periodChangePct ?? 0) > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 light:border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 light:text-slate-900 tracking-tight">
              Historical Pollution Tracker
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Atmospheric reanalysis and statistical anomaly spike detection for{' '}
            <strong className="text-slate-200 light:text-slate-700">{currentLocation?.city}</strong>
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-300 text-xs w-full sm:w-auto">
          <button
            onClick={() => setDays(7)}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg font-semibold transition-all min-h-[38px] touch-manipulation text-center ${
              days === 7
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
            }`}
          >
            <span className="hidden sm:inline">Last </span>7 Days
          </button>
          <button
            onClick={() => setDays(30)}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg font-semibold transition-all min-h-[38px] touch-manipulation text-center ${
              days === 30
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
            }`}
          >
            <span className="hidden sm:inline">Last </span>30 Days
          </button>
          <button
            onClick={() => setDays(90)}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg font-semibold transition-all min-h-[38px] touch-manipulation text-center ${
              days === 90
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
            }`}
          >
            <span className="hidden sm:inline">Last </span>90 Days
          </button>
        </div>
      </div>

      {/* Metric Change Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Period Trend Card */}
        <div className="p-4 rounded-xl bg-slate-900/70 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Period-over-Period Trend</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-2xl font-black tabular-nums ${
                  isWorsening ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {historyData?.periodChangePct !== undefined
                  ? `${historyData.periodChangePct > 0 ? '+' : ''}${historyData.periodChangePct}%`
                  : '0%'}
              </span>
              <span className="text-xs text-slate-400">
                {isWorsening ? 'Pollution Increased' : 'Air Quality Improved'}
              </span>
            </div>
          </div>
          <div
            className={`p-3 rounded-xl ${
              isWorsening ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {isWorsening ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
        </div>

        {/* Current vs Previous Average */}
        <div className="p-4 rounded-xl bg-slate-900/70 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Average Period AQI</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-100 light:text-slate-900 tabular-nums">
                {historyData?.currentPeriodAvg ?? 'N/A'}
              </span>
              <span className="text-xs text-slate-400">
                (Prev half: {historyData?.prevPeriodAvg ?? 'N/A'})
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Anomaly Spikes Detected */}
        <div className="p-4 rounded-xl bg-slate-900/70 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Detected Pollution Spikes</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400 tabular-nums">
                {historyData?.spikes.length ?? 0}
              </span>
              <span className="text-xs text-slate-400">(&gt; Mean + 2σ)</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Interactive Recharts Section */}
      <div className="p-4 sm:p-6 bg-slate-900/80 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 shadow-md">
        {/* Chart View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveChart('aqi')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-colors min-h-[38px] touch-manipulation text-center ${
                activeChart === 'aqi'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-slate-700'
              }`}
            >
              Daily Overall AQI
            </button>
            <button
              onClick={() => setActiveChart('particulates')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-colors min-h-[38px] touch-manipulation text-center ${
                activeChart === 'particulates'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-slate-700'
              }`}
            >
              PM2.5 vs PM10 Comparison
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Red points indicate statistical anomaly spikes (&gt; Mean + 2σ)</span>
          </div>
        </div>

        {/* Chart Rendering */}
        <div className="w-full min-w-0 h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === 'aqi' ? (
              <AreaChart data={historyData?.daily || []}>
                <defs>
                  <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(str) => str.slice(5)}
                  stroke="#94a3b8"
                  fontSize={11}
                />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 'auto']} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const cat = getAqiCategory(item.aqi, standard);
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 text-white">
                          <p className="font-bold text-slate-300">{item.date}</p>
                          <p className="text-base font-extrabold" style={{ color: cat.color }}>
                            AQI: {item.aqi} ({cat.name})
                          </p>
                          <p className="text-slate-400">PM2.5: {item.pm25} µg/m³</p>
                          <p className="text-slate-400">PM10: {item.pm10} µg/m³</p>
                          {item.isSpike && (
                            <p className="text-rose-400 font-bold flex items-center gap-1 mt-1">
                              ⚠️ Anomaly Spike (+{item.deviationMultiplier}σ)
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={50} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Good', fill: '#10b981', fontSize: 10 }} />
                <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Moderate', fill: '#f59e0b', fontSize: 10 }} />
                <ReferenceLine y={200} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Unhealthy', fill: '#ef4444', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="aqi"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#aqiGrad)"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.isSpike) {
                      return (
                        <circle
                          key={payload.date}
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="#ef4444"
                          stroke="#ffffff"
                          strokeWidth={2}
                          className="animate-ping"
                        />
                      );
                    }
                    return <circle key={payload.date} cx={cx} cy={cy} r={2} fill="#38bdf8" />;
                  }}
                />
              </AreaChart>
            ) : (
              <LineChart data={historyData?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="date" tickFormatter={(str) => str.slice(5)} stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 text-white">
                          <p className="font-bold text-slate-300">{item.date}</p>
                          <p className="text-sky-400 font-bold">PM2.5: {item.pm25} µg/m³</p>
                          <p className="text-indigo-400 font-bold">PM10: {item.pm10} µg/m³</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="pm25" stroke="#38bdf8" strokeWidth={2.5} name="PM2.5 (Fine)" dot={false} />
                <Line type="monotone" dataKey="pm10" stroke="#818cf8" strokeWidth={2} name="PM10 (Coarse)" dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Data Provenance & Model Label */}
        <div className="mt-4 pt-3 border-t border-slate-800 light:border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Source: {historyData?.source || 'Open-Meteo ERA5 Reanalysis Archive'}
          </span>
          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
            {historyData?.badge || 'Modeled estimate'}
          </span>
        </div>
      </div>

      {/* Spike Detection Breakdown List */}
      <div>
        <h3 className="text-base font-bold text-slate-100 light:text-slate-900 mb-3 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-rose-500" />
          Pollution Spike Events Breakdown ({historyData?.spikes.length || 0})
        </h3>

        {(!historyData?.spikes || historyData.spikes.length === 0) ? (
          <div className="p-6 rounded-xl bg-slate-900/40 light:bg-slate-50 border border-slate-800 light:border-slate-200 text-center text-xs text-slate-400">
            No statistical pollution spikes detected over this {days}-day window. Air quality maintained regular seasonal patterns.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {historyData.spikes.map((spike, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/90 light:bg-white border border-rose-500/30 shadow-sm text-xs space-y-2 hover:border-rose-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400 font-mono">{spike.date}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-semibold text-[10px]">
                    +{spike.deviationMultiplier}σ Above Baseline
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-slate-400">Recorded AQI:</span>
                  <span className="text-xl font-extrabold text-slate-100 light:text-slate-900">
                    {spike.aqi}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-800/50 light:bg-slate-100 p-2 rounded-lg">
                  <div>
                    <span>Rolling Mean: </span>
                    <strong className="text-slate-200 light:text-slate-800">{spike.mean}</strong>
                  </div>
                  <div>
                    <span>Threshold: </span>
                    <strong className="text-slate-200 light:text-slate-800">{spike.threshold}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">
                  Likely atmospheric cause: Thermal temperature inversion, stagnation or sudden biomass/vehicular emission surge.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
