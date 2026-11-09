import React from 'react';
import { AqiStandard, calculatePollutantAqi, getAqiCategory } from '../lib/aqi';
import { Info } from 'lucide-react';

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

  // Percentage of WHO guideline limit
  const whoRatio = isAvailable && whoLimit > 0 ? value / whoLimit : 0;
  const barPercent = Math.min(100, Math.max(5, (whoRatio / 3) * 100));

  return (
    <div className="relative flex flex-col justify-between p-4 bg-slate-900/70 light:bg-white rounded-xl border border-slate-800 light:border-slate-200 shadow-sm hover:border-slate-700 light:hover:border-slate-300 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="text-base font-bold text-slate-100 light:text-slate-900">{name}</h4>
            <span className="text-[11px] text-slate-400 light:text-slate-500 font-mono">
              ({unit})
            </span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-500 leading-none mt-0.5">
            {chemicalName}
          </p>
        </div>

        {isAvailable && category ? (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
            style={{
              backgroundColor: category.bgColor,
              borderColor: category.borderColor,
              color: category.color,
            }}
          >
            {category.name}
          </span>
        ) : (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 light:bg-slate-100 text-slate-400 light:text-slate-500">
            Unreported
          </span>
        )}
      </div>

      {/* Main Value */}
      <div className="my-3 flex items-baseline gap-1.5">
        {isAvailable ? (
          <>
            <span
              className="text-3xl font-extrabold tracking-tight tabular-nums"
              style={{ color: category?.color || '#38bdf8' }}
            >
              {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value}
            </span>
            <span className="text-xs font-medium text-slate-400 light:text-slate-500">{unit}</span>
          </>
        ) : (
          <div className="flex items-center gap-1 text-slate-500 light:text-slate-400">
            <span className="text-2xl font-bold font-mono">N/A</span>
            <span className="text-xs italic">(Station not reporting)</span>
          </div>
        )}
      </div>

      {/* Mini Severity / Progress Bar */}
      <div>
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

        <div className="flex items-center justify-between text-[11px] text-slate-400 light:text-slate-500 mt-1.5">
          <span>WHO Guideline: {whoLimit} {unit}</span>
          {isAvailable && whoLimit > 0 && (
            <span className={whoRatio > 1 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-medium'}>
              {whoRatio <= 1 ? 'Within WHO target' : `${whoRatio.toFixed(1)}x WHO limit`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
