import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { SparklinePoint, AqiStandard } from '../types/aqi';
import { getAqiCategory } from '../lib/aqi';

interface AqiSparklineProps {
  data: SparklinePoint[] | undefined;
  currentAqi: number;
  standard: AqiStandard;
  city: string;
  lat?: number;
  lng?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: SparklinePoint;
  }>;
  label?: string;
  standard: AqiStandard;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, standard }) => {
  if (!active || !payload || !payload.length) return null;

  const pt = payload[0].payload;
  const aqiVal = payload[0].value;
  const cat = getAqiCategory(aqiVal, standard);

  // Format time nicely
  const dateObj = new Date(pt.time);
  const timeFormatted = isNaN(dateObj.getTime())
    ? pt.hour
    : dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  const dateFormatted = isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="p-3 rounded-xl bg-slate-900/95 light:bg-white/95 backdrop-blur-md border border-slate-700/80 light:border-slate-200 shadow-xl text-xs space-y-1.5 min-w-[170px] z-50">
      <div className="flex items-center justify-between text-[11px] text-slate-400 light:text-slate-500 border-b border-slate-800 light:border-slate-100 pb-1.5">
        <span className="font-semibold">{dateFormatted}</span>
        <span className="font-mono">{timeFormatted}</span>
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <span className="text-slate-300 light:text-slate-600 font-medium">AQI Value</span>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
          <strong className="text-sm font-black text-slate-100 light:text-slate-900 font-mono">
            {aqiVal}
          </strong>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400 light:text-slate-500">Air Status</span>
        <span
          className="font-semibold px-1.5 py-0.5 rounded text-[10px]"
          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
        >
          {cat.name}
        </span>
      </div>

      {pt.pm25 !== undefined && pt.pm25 !== null && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 light:text-slate-500 pt-1 border-t border-slate-800/60 light:border-slate-100">
          <span>PM2.5 Level</span>
          <span className="font-mono text-slate-200 light:text-slate-700 font-medium">
            {pt.pm25} µg/m³
          </span>
        </div>
      )}
    </div>
  );
};

export const AqiSparkline: React.FC<AqiSparklineProps> = ({
  data: initialData,
  currentAqi,
  standard,
  city,
  lat,
  lng,
}) => {
  const [sparklineData, setSparklineData] = useState<SparklinePoint[]>(initialData || []);
  const [loading, setLoading] = useState(false);

  // If initialData is missing or empty, fetch dedicated /api/aqi/sparkline
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setSparklineData(initialData);
      return;
    }

    if (lat !== undefined && lng !== undefined) {
      let isCancelled = false;
      setLoading(true);

      fetch(`/api/aqi/sparkline?lat=${lat}&lng=${lng}&standard=${standard}`)
        .then((res) => res.json())
        .then((json) => {
          if (!isCancelled && json.sparkline && json.sparkline.length > 0) {
            setSparklineData(json.sparkline);
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
  }, [initialData, lat, lng, standard, city]);

  const category = getAqiCategory(currentAqi, standard);
  const color = category.color || '#38bdf8';

  // Compute metrics
  const points = sparklineData.length > 0 ? sparklineData : [];
  const aqiValues = points.map((p) => p.aqi);

  const minAqi = aqiValues.length > 0 ? Math.min(...aqiValues) : currentAqi;
  const maxAqi = aqiValues.length > 0 ? Math.max(...aqiValues) : currentAqi;
  const minPoint = points.find((p) => p.aqi === minAqi);
  const maxPoint = points.find((p) => p.aqi === maxAqi);

  const avgAqi =
    aqiValues.length > 0
      ? Math.round(aqiValues.reduce((sum, val) => sum + val, 0) / aqiValues.length)
      : currentAqi;

  const firstPointAqi = aqiValues.length > 0 ? aqiValues[0] : currentAqi;
  const lastPointAqi = aqiValues.length > 0 ? aqiValues[aqiValues.length - 1] : currentAqi;
  const deltaAqi = lastPointAqi - firstPointAqi;
  const deltaPct =
    firstPointAqi > 0
      ? Math.round(((lastPointAqi - firstPointAqi) / firstPointAqi) * 100)
      : 0;

  // Format hour labels for XAxis: show every 4-6 hours to avoid clutter
  const formattedChartData = points.map((p, idx) => {
    const isEdge = idx === 0 || idx === points.length - 1;
    const isQuarter = idx % 6 === 0;
    return {
      ...p,
      displayLabel: isEdge || isQuarter ? p.hour : '',
    };
  });

  return (
    <div className="p-5 sm:p-6 bg-slate-900/90 light:bg-white rounded-3xl border border-slate-800/90 light:border-slate-200/90 shadow-xl backdrop-blur-xl transition-all space-y-4">
      {/* Header and 24h Summary Statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Activity className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-100 light:text-slate-900 flex items-center gap-1.5">
              24-Hour AQI Trend & Fluctuations
            </h4>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 light:bg-slate-100 text-slate-400 light:text-slate-600 border border-slate-700/60 light:border-slate-200">
              Last 24h
            </span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-500 pl-8">
            Hourly continuous atmospheric trajectory for {city}
          </p>
        </div>

        {/* 24-Hour Metric Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Trend badge */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
              deltaAqi > 5
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : deltaAqi < -5
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-600 border-slate-700/60 light:border-slate-200'
            }`}
          >
            {deltaAqi > 5 ? (
              <>
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                <span>+{deltaAqi} pts (+{deltaPct}%)</span>
              </>
            ) : deltaAqi < -5 ? (
              <>
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>{deltaAqi} pts ({deltaPct}%)</span>
              </>
            ) : (
              <>
                <Minus className="w-3.5 h-3.5 text-slate-400" />
                <span>Stable (±{Math.abs(deltaAqi)} pts)</span>
              </>
            )}
          </div>

          {/* 24h Low & High */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/40 light:bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-700/40 light:border-slate-200">
            <span>Low:</span>
            <strong className="text-emerald-400 font-mono font-bold">{minAqi}</strong>
            <span className="text-slate-600 px-0.5">•</span>
            <span>High:</span>
            <strong className="text-amber-400 font-mono font-bold">{maxAqi}</strong>
            <span className="text-slate-600 px-0.5">•</span>
            <span>Avg:</span>
            <strong className="text-slate-200 light:text-slate-800 font-mono font-bold">{avgAqi}</strong>
          </div>
        </div>
      </div>

      {/* Sparkline Chart Container */}
      <div className="relative w-full h-36 pt-2 select-none">
        {loading && points.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 animate-pulse">
            Loading 24-hour atmospheric telemetry...
          </div>
        ) : points.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
            No historical hourly records available for this station.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedChartData}
              margin={{ top: 8, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="displayLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                interval={0}
              />

              <YAxis
                hide
                domain={['dataMin - 15', 'dataMax + 15']}
              />

              {/* Threshold reference lines */}
              <ReferenceLine
                y={50}
                stroke="#10b981"
                strokeDasharray="2 3"
                strokeOpacity={0.25}
              />
              <ReferenceLine
                y={100}
                stroke="#eab308"
                strokeDasharray="2 3"
                strokeOpacity={0.25}
              />
              <ReferenceLine
                y={200}
                stroke="#f43f5e"
                strokeDasharray="2 3"
                strokeOpacity={0.25}
              />

              <Tooltip
                content={<CustomTooltip standard={standard} />}
                cursor={{
                  stroke: color,
                  strokeWidth: 1.5,
                  strokeDasharray: '3 3',
                  opacity: 0.7,
                }}
              />

              <Area
                type="monotone"
                dataKey="aqi"
                stroke={color}
                strokeWidth={2.5}
                fill="url(#sparklineGradient)"
                activeDot={{
                  r: 5,
                  fill: color,
                  stroke: '#0f172a',
                  strokeWidth: 2,
                }}
                isAnimationActive={true}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Info & Peak Callouts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 light:text-slate-500 pt-1 border-t border-slate-800/60 light:border-slate-100 gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>
            24h Progression: Started at <strong className="text-slate-300 light:text-slate-700 font-mono">{firstPointAqi} AQI</strong> ({points[0]?.hour || '24h ago'}), now at{' '}
            <strong className="text-slate-200 light:text-slate-800 font-mono">{currentAqi} AQI</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {minPoint && (
            <span>
              Best hour: <strong className="text-emerald-400 font-medium">{minPoint.hour}</strong> ({minPoint.aqi} AQI)
            </span>
          )}
          {maxPoint && (
            <span>
              Peak hour: <strong className="text-rose-400 font-medium">{maxPoint.hour}</strong> ({maxPoint.aqi} AQI)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
