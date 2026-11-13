import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Trophy,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { LocationData, AqiStandard } from '../types/aqi';
import { getAqiCategory, calculateDifferenceMultiplier } from '../lib/aqi';

interface ComparisonViewProps {
  currentLocation: LocationData | null;
  standard: AqiStandard;
}

const PRESET_CITIES = ['Delhi', 'London', 'New York', 'Tokyo', 'Shimla', 'Sydney', 'Paris', 'Beijing'];

export const ComparisonView: React.FC<ComparisonViewProps> = ({ currentLocation, standard }) => {
  const [selectedCities, setSelectedCities] = useState<string[]>(() => {
    const rawCurrent = currentLocation?.city ? currentLocation.city.split(',')[0].trim() : 'Delhi';
    const unique = [rawCurrent];
    const candidateList = ['London', 'Shimla', 'Tokyo', 'New York'];
    for (const c of candidateList) {
      if (!unique.some((u) => u.toLowerCase() === c.toLowerCase())) {
        unique.push(c);
      }
      if (unique.length === 3) break;
    }
    return unique;
  });
  const [cityDataList, setCityDataList] = useState<LocationData[]>([]);
  const [historyList, setHistoryList] = useState<Record<string, { date: string; aqi: number }[]>>({});
  const [loading, setLoading] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Fetch data for all selected cities
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    Promise.all(
      selectedCities.map((c) =>
        fetch(`/api/aqi/live?city=${encodeURIComponent(c)}&standard=${standard}`).then((r) => r.json())
      )
    )
      .then((results) => {
        if (!isCancelled) {
          const valid = results.filter((r) => !r.error);
          setCityDataList(valid);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) setLoading(false);
      });

    // Also fetch 7-day history for overlay trend
    Promise.all(
      selectedCities.map((c) =>
        fetch(`/api/aqi/history?city=${encodeURIComponent(c)}&days=7&standard=${standard}`)
          .then((r) => r.json())
          .then((h) => ({ city: c, history: h.daily || [] }))
      )
    ).then((histories) => {
      if (!isCancelled) {
        const map: Record<string, { date: string; aqi: number }[]> = {};
        histories.forEach((h) => {
          map[h.city] = h.history;
        });
        setHistoryList(map);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedCities, standard]);

  const handleAddCity = (cityToAdd: string) => {
    const trimmed = cityToAdd.trim();
    if (
      !trimmed ||
      selectedCities.some((c) => c.toLowerCase() === trimmed.toLowerCase()) ||
      selectedCities.length >= 5
    )
      return;
    setSelectedCities([...selectedCities, trimmed]);
    setAddInput('');
  };

  const handleRemoveCity = (cityToRemove: string) => {
    if (selectedCities.length <= 2) {
      setNotice('A minimum of 2 locations is required for comparative analysis.');
      setTimeout(() => setNotice(null), 3000);
      return;
    }
    setSelectedCities(selectedCities.filter((c) => c !== cityToRemove));
  };

  // Determine relatively cleaner air winner
  const cleanestLocation =
    cityDataList.length > 0
      ? [...cityDataList].sort((a, b) => a.aqi - b.aqi)[0]
      : null;

  // Build merged chart data for overlay
  const mergedDates: string[] = [];
  Object.values(historyList).forEach((h) => {
    h.forEach((pt) => {
      if (!mergedDates.includes(pt.date)) mergedDates.push(pt.date);
    });
  });
  mergedDates.sort();

  const chartData = mergedDates.map((date) => {
    const entry: Record<string, string | number> = { date: date.slice(5) };
    selectedCities.forEach((city) => {
      const found = historyList[city]?.find((pt) => pt.date === date);
      if (found) {
        entry[city] = found.aqi;
      }
    });
    return entry;
  });

  const cityColors = ['#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 light:border-slate-200">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-400 shrink-0" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 light:text-slate-900 tracking-tight">
              Multi-Location Air Quality Comparison
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Compare 2 to 5 locations simultaneously with differential metrics and overlaid trend lines.
          </p>
        </div>

        {/* Add Location Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddCity(addInput);
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto"
        >
          <input
            type="text"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            placeholder="Add city to compare..."
            disabled={selectedCities.length >= 5}
            className="flex-1 md:w-56 bg-slate-900 light:bg-slate-100 border border-slate-700 light:border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-100 light:text-slate-900 focus:outline-none focus:border-sky-500 disabled:opacity-40 min-h-[42px]"
          />
          <button
            type="submit"
            disabled={!addInput.trim() || selectedCities.length >= 5}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-40 whitespace-nowrap min-h-[42px] touch-manipulation shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
      </div>

      {/* Inline Notice */}
      {notice && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 flex items-center gap-2 animate-in fade-in">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Preset Quick Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        <span className="text-slate-500 shrink-0 whitespace-nowrap">Quick add:</span>
        {PRESET_CITIES.filter((c) => !selectedCities.some((sc) => sc.toLowerCase() === c.toLowerCase())).map((c) => (
          <button
            type="button"
            key={`preset-city-${c}`}
            onClick={() => handleAddCity(c)}
            disabled={selectedCities.length >= 5}
            className="px-3 py-1.5 rounded-full bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-slate-300 light:text-slate-700 hover:border-sky-500 transition-colors whitespace-nowrap shrink-0 min-h-[38px] touch-manipulation"
          >
            + {c}
          </button>
        ))}
      </div>

      {/* Winner Spotlight Banner: Relatively Cleaner Air */}
      {cleanestLocation && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-emerald-950/40 light:from-emerald-50 light:to-sky-50 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Relatively Cleaner Air Winner
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-100 light:text-slate-900 break-words">
                {cleanestLocation.city} (AQI: {cleanestLocation.aqi})
              </h3>
              <p className="text-xs text-slate-300 light:text-slate-600 mt-0.5">
                Current atmospheric conditions indicate significantly lower particulate burden.
              </p>
            </div>
          </div>

          {/* Difference Multiplier vs worst */}
          {cityDataList.length >= 2 && (
            <div className="w-full sm:w-auto text-left sm:text-right text-xs bg-slate-900/60 light:bg-white p-2.5 rounded-xl border border-slate-800 light:border-slate-200 shrink-0">
              {(() => {
                const worst = [...cityDataList].sort((a, b) => b.aqi - a.aqi)[0];
                const multiplier = calculateDifferenceMultiplier(worst.aqi, cleanestLocation.aqi);
                return (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Differential Impact</span>
                    <strong className="text-rose-400 font-mono text-sm">
                      {worst.city.split(',')[0]} is {multiplier} higher AQI
                    </strong>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Comparison Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cityDataList.map((item, idx) => {
          const cat = getAqiCategory(item.aqi, standard);
          return (
            <div
              key={`city-card-${item.city}-${idx}`}
              className="min-w-0 p-4 sm:p-5 rounded-2xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-100 light:text-slate-900 text-base truncate">
                    {item.city}
                  </h4>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {item.stationName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCity(selectedCities[idx])}
                  disabled={selectedCities.length <= 2}
                  title={selectedCities.length <= 2 ? 'Minimum 2 locations required for comparison' : `Remove ${item.city}`}
                  aria-label={`Remove ${item.city}`}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0 touch-manipulation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* AQI Display */}
              <div className="flex items-baseline justify-between p-3 rounded-xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/40 light:border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">AQI</span>
                  <span
                    className="text-4xl font-extrabold tabular-nums"
                    style={{ color: cat.color }}
                  >
                    {item.aqi}
                  </span>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold border"
                  style={{
                    backgroundColor: cat.bgColor,
                    borderColor: cat.borderColor,
                    color: cat.color,
                  }}
                >
                  {cat.name}
                </span>
              </div>

              {/* Pollutants Matrix */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800 light:border-slate-100">
                  <span className="text-slate-400">PM2.5:</span>
                  <span className="font-bold font-mono text-slate-200 light:text-slate-800">
                    {item.pollutants.pm25 !== null ? `${item.pollutants.pm25} µg/m³` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 light:border-slate-100">
                  <span className="text-slate-400">PM10:</span>
                  <span className="font-bold font-mono text-slate-200 light:text-slate-800">
                    {item.pollutants.pm10 !== null ? `${item.pollutants.pm10} µg/m³` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 light:border-slate-100">
                  <span className="text-slate-400">NO₂:</span>
                  <span className="font-bold font-mono text-slate-200 light:text-slate-800">
                    {item.pollutants.no2 !== null ? `${item.pollutants.no2} µg/m³` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">O₃:</span>
                  <span className="font-bold font-mono text-slate-200 light:text-slate-800">
                    {item.pollutants.o3 !== null ? `${item.pollutants.o3} µg/m³` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 light:border-slate-200 text-[10px] text-slate-500 truncate">
                Source: {item.sourceName} • {item.badge}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overlaid Historical Trend Lines Chart */}
      <div className="p-4 sm:p-6 bg-slate-900/80 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 shadow-md space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 light:text-slate-900">
            Comparative 7-Day AQI Trend Overlay
          </h3>
          <p className="text-xs text-slate-400">
            Daily air quality trajectories synchronized over the last week.
          </p>
        </div>

        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.45} />
              <XAxis dataKey="date" stroke="#a3a3a3" fontSize={11} minTickGap={24} />
              <YAxis stroke="#a3a3a3" fontSize={11} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  borderColor: '#262626',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {selectedCities.map((city, idx) => (
                <Line
                  key={`line-city-${city}-${idx}`}
                  type="monotone"
                  dataKey={city}
                  stroke={cityColors[idx % cityColors.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
