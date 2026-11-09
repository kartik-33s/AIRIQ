import React from 'react';
import { Printer, X, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { LocationData, HistoryData } from '../types/aqi';
import { getAqiCategory } from '../lib/aqi';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LocationData | null;
  history: HistoryData | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, data, history }) => {
  if (!isOpen || !data) return null;

  const category = getAqiCategory(data.aqi, data.standard);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 shadow-2xl p-6 my-8 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 light:border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-slate-100 light:text-slate-900 text-lg">
              Pollution Impact & Health Report
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              aria-label="Close Report"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-100 light:hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-6 text-slate-200 light:text-slate-800 text-sm print:text-black">
          {/* Executive Header */}
          <div className="border-b border-slate-800 light:border-slate-200 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-sky-400 light:text-sky-600 tracking-tight">
                  AirIQ Environmental Assessment
                </h1>
                <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                  Location: {data.city} ({data.stationName})
                </p>
                <p className="text-xs text-slate-400 light:text-slate-500">
                  Assessment Date: {new Date(data.lastUpdated).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 light:bg-slate-100 font-mono text-slate-300 light:text-slate-700">
                  Standard: {data.standard === 'US_EPA' ? 'US EPA' : 'India CPCB'}
                </span>
              </div>
            </div>
          </div>

          {/* Key Findings Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 light:bg-slate-50 border border-slate-700/60 light:border-slate-200">
            <h4 className="font-bold text-slate-100 light:text-slate-900 text-sm mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Executive Summary
            </h4>
            <p className="text-xs leading-relaxed text-slate-300 light:text-slate-600">
              The ambient Air Quality Index (AQI) in <strong>{data.city}</strong> currently registers at{' '}
              <strong>{data.aqi}</strong>, categorized as <strong>{category.name}</strong>. The dominant
              contributor to particulate contamination is{' '}
              <strong>{data.dominant?.toUpperCase() || 'PM2.5'}</strong>. Under this atmospheric tier,{' '}
              {category.generalAdvice}
            </p>
          </div>

          {/* Measured Pollutants Table */}
          <div>
            <h4 className="font-bold text-slate-100 light:text-slate-900 text-sm mb-2">
              Pollutant Breakdown & Concentrations
            </h4>
            <table className="w-full text-xs border border-slate-800 light:border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-800 light:bg-slate-100 text-slate-400 light:text-slate-600 font-semibold text-left">
                <tr>
                  <th className="p-2.5">Pollutant</th>
                  <th className="p-2.5">Concentration</th>
                  <th className="p-2.5">WHO Target</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 light:divide-slate-200 font-mono">
                <tr>
                  <td className="p-2.5 font-bold">PM2.5 (Fine Particles)</td>
                  <td className="p-2.5">{data.pollutants.pm25 !== null ? `${data.pollutants.pm25} µg/m³` : 'N/A'}</td>
                  <td className="p-2.5">15 µg/m³</td>
                  <td className="p-2.5">
                    {data.pollutants.pm25 && data.pollutants.pm25 > 15 ? 'Exceeds WHO' : 'Compliant'}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">PM10 (Respirable Dust)</td>
                  <td className="p-2.5">{data.pollutants.pm10 !== null ? `${data.pollutants.pm10} µg/m³` : 'N/A'}</td>
                  <td className="p-2.5">45 µg/m³</td>
                  <td className="p-2.5">
                    {data.pollutants.pm10 && data.pollutants.pm10 > 45 ? 'Exceeds WHO' : 'Compliant'}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">NO₂ (Nitrogen Dioxide)</td>
                  <td className="p-2.5">{data.pollutants.no2 !== null ? `${data.pollutants.no2} µg/m³` : 'N/A'}</td>
                  <td className="p-2.5">25 µg/m³</td>
                  <td className="p-2.5">
                    {data.pollutants.no2 && data.pollutants.no2 > 25 ? 'Elevated' : 'Safe'}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">O₃ (Ground Ozone)</td>
                  <td className="p-2.5">{data.pollutants.o3 !== null ? `${data.pollutants.o3} µg/m³` : 'N/A'}</td>
                  <td className="p-2.5">100 µg/m³</td>
                  <td className="p-2.5">
                    {data.pollutants.o3 && data.pollutants.o3 > 100 ? 'Elevated' : 'Safe'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Historical Trend Note if available */}
          {history && (
            <div className="p-3 bg-slate-800/40 light:bg-slate-50 rounded-xl border border-slate-700/50 light:border-slate-200 text-xs">
              <h5 className="font-bold text-slate-200 light:text-slate-800 mb-1">
                Historical Trend ({history.days} Days Window)
              </h5>
              <p className="text-slate-300 light:text-slate-600">
                Over the analyzed period, average AQI was <strong>{history.currentPeriodAvg}</strong>,
                representing a{' '}
                <strong>
                  {history.periodChangePct >= 0
                    ? `+${history.periodChangePct}% increase`
                    : `${history.periodChangePct}% improvement`}
                </strong>{' '}
                versus the preceding baseline. A total of{' '}
                <strong>{history.spikes.length} statistical anomaly spikes</strong> were recorded.
              </p>
            </div>
          )}

          {/* Actionable Medical Advice & Disclaimer */}
          <div className="pt-2 border-t border-slate-800 light:border-slate-200 text-[11px] text-slate-400 light:text-slate-500 space-y-1">
            <p>
              <strong>Data Provenance:</strong> Ground-station measurements ingested via WAQI, with
              numerical atmospheric reanalysis powered by Open-Meteo & Copernicus.
            </p>
            <p className="italic">
              <strong>Medical Disclaimer:</strong> This environmental intelligence document does not
              constitute formal clinical diagnosis. Individuals with acute respiratory, cardiovascular, or
              pulmonary distress should seek prompt clinical medical care.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
