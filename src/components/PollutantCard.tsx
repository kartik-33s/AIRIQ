import React from 'react';
import { AqiStandard, calculatePollutantAqi, getAqiCategory } from '../lib/aqi';
import { ShieldAlert, ShieldCheck, AlertCircle } from 'lucide-react';

interface PollutantCardProps {
  id: 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3';
  name: string;
  chemicalName: string;
  value: number | null | undefined;
  unit: string;
  whoLimit: number;
  standard: AqiStandard;
}

export const PollutantCard: React.FC<PollutantCardProps> = ({
  id,
  name,
  chemicalName,
  value,
  unit,
  whoLimit,
  standard,
}) => {
  const isAvailable = value !== null && value !== undefined && !isNaN(value);

  // Calculate pollutant sub-AQI
  const subAqi = isAvailable ? calculatePollutantAqi(id, value, standard) : null;
  const category = subAqi !== null ? getAqiCategory(subAqi, standard) : null;

  // Scientific biological impact taglines
  const impactMap: Record<string, { tag: string; origin: string }> = {
    pm25: {
      tag: 'Penetrates deep lung alveoli & enters bloodstream',
      origin: 'Vehicle exhaust, biomass burning & industrial smoke',
    },
    pm10: {
      tag: 'Irritates upper respiratory airways & eyes',
      origin: 'Road dust, construction & windblown soil',
    },
    no2: {
      tag: 'Triggers airway inflammation & asthma symptoms',
      origin: 'High-temperature diesel & gasoline combustion',
    },
    so2: {
      tag: 'Bronchoconstriction & acid particulate precursor',
      origin: 'Coal power generation & petrochemical refining',
    },
    o3: {
      tag: 'Powerful pulmonary oxidant reducing lung capacity',
      origin: 'Photochemical reaction of VOCs + NOx under sunlight',
    },
    co: {
      tag: 'Impairs arterial blood oxygen transport capacity',
      origin: 'Incomplete fossil fuel & biomass combustion',
    },
  };

  const bioImpact = impactMap[id] || {
    tag: 'Ambient atmospheric pollutant',
    origin: 'Urban & industrial emissions',
  };

  // Multiple of WHO 2021 air quality guideline
  const whoMultiplier = isAvailable && whoLimit > 0 ? (value / whoLimit).toFixed(1) : null;
  const isExceedingWho = whoMultiplier !== null && parseFloat(whoMultiplier) > 1.0;

  // Normalized bar progress
  const barPercent = isAvailable && whoLimit > 0
    ? Math.min(100, Math.max(8, (value / (whoLimit * 2.5)) * 100))
    : 0;

  return (
    <div className="relative flex flex-col justify-between p-4 sm:p-5 bg-slate-900/90 light:bg-white rounded-3xl border border-slate-800/90 light:border-slate-200/90 shadow-xl backdrop-blur-xl hover:border-slate-700 light:hover:border-slate-300 transition-all duration-200 group overflow-hidden">
      {/* Subtle top indicator bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-all"
        style={{ backgroundColor: category?.color || '#334155' }}
      />

      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xl font-black text-slate-100 light:text-slate-900 tracking-tight">
                {name}
              </h4>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 light:bg-slate-100 text-slate-400 light:text-slate-600 font-semibold">
                {unit}
              </span>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-500 font-medium mt-0.5 break-words">
              {chemicalName}
            </p>
          </div>

          {isAvailable && category ? (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0"
              style={{
                backgroundColor: `${category.color}18`,
                borderColor: `${category.color}40`,
                color: category.color,
              }}
            >
              {category.name}
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 light:bg-slate-100 text-slate-400">
              Offline
            </span>
          )}
        </div>

        {/* Main Concentration Reading */}
        <div className="mt-4 mb-3 flex items-baseline gap-2">
          {isAvailable ? (
            <>
              <span
                className="text-4xl font-black tracking-tight tabular-nums drop-shadow-sm"
                style={{ color: category?.color || '#38bdf8' }}
              >
                {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value}
              </span>
              <span className="text-xs font-semibold text-slate-400 light:text-slate-500">{unit}</span>
            </>
          ) : (
            <div className="flex items-baseline gap-1.5 text-slate-500">
              <span className="text-3xl font-black font-mono">N/A</span>
              <span className="text-xs italic">(Sensor Offline)</span>
            </div>
          )}
        </div>
      </div>

      {/* Spectrometric Guideline Bar & Biological Impact */}
      <div className="space-y-3 pt-2 border-t border-slate-800/60 light:border-slate-200/60">
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400 light:text-slate-500 flex items-center gap-1">
              WHO 2021 Reference:
            </span>
            <span className="font-mono font-semibold text-slate-300 light:text-slate-700">
              {whoLimit} {unit}
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-800 light:bg-slate-200 rounded-full overflow-hidden">
            {isAvailable ? (
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${barPercent}%`,
                  backgroundColor: category?.color || '#38bdf8',
                }}
              />
            ) : (
              <div className="h-full w-0 bg-transparent" />
            )}
          </div>
        </div>

        {/* WHO Guideline Multiplier Tag */}
        {isAvailable && whoMultiplier && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 light:text-slate-500">Benchmark Ratio:</span>
            <span
              className={`font-mono font-bold ${
                isExceedingWho ? 'text-amber-400 light:text-amber-600' : 'text-emerald-400 light:text-emerald-600'
              }`}
            >
              {isExceedingWho ? `${whoMultiplier}× Above WHO Guideline` : 'Within WHO Guideline'}
            </span>
          </div>
        )}

        {/* Biological Pathology Tag */}
        <p className="text-[10px] text-slate-400 light:text-slate-500 leading-tight">
          {bioImpact.tag}
        </p>
      </div>
    </div>
  );
};
