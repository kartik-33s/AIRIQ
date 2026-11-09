import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Share2, X, Sparkles, Check, RefreshCw } from 'lucide-react';
import { LocationData } from '../types/aqi';
import { getAqiCategory, formatRelativeTime } from '../lib/aqi';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LocationData | null;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({ isOpen, onClose, data }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const category = getAqiCategory(data.aqi, data.standard);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 0.95,
        skipFonts: true,
        fontEmbedCSS: '',
      });
      const link = document.createElement('a');
      link.download = `AirIQ-${data.city.split(',')[0].trim().replace(/\s+/g, '-')}-AQI.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export card image:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AirIQ Report: ${data.city} Air Quality`,
          text: `Current AQI in ${data.city} is ${data.aqi} (${category.name}). Standard: ${
            data.standard === 'US_EPA' ? 'US EPA' : 'India CPCB'
          }.`,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(
        `AirIQ Report: Current AQI in ${data.city} is ${data.aqi} (${category.name}). Checked via AirIQ Platform.`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-slate-100 light:text-slate-900 text-base">
              Share Air Quality Card
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Share Card"
            className="p-1 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Printable / Capturable Card */}
        <div className="mt-4 flex justify-center">
          <div
            ref={cardRef}
            className="w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-700/60 shadow-xl relative overflow-hidden"
          >
            {/* Top Brand Tag */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-extrabold tracking-wider text-sky-400 flex items-center gap-1">
                AirIQ <span className="text-[10px] text-slate-400 font-normal">Platform</span>
              </span>
              <span className="text-[10px] bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
                {data.standard === 'US_EPA' ? 'US EPA' : 'India CPCB'}
              </span>
            </div>

            {/* City & Timestamp */}
            <h4 className="text-xl font-bold tracking-tight text-slate-100">{data.city}</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Updated {formatRelativeTime(data.lastUpdated)} • {data.sourceName}
            </p>

            {/* Main AQI Section */}
            <div className="my-5 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">AIR QUALITY INDEX</span>
                <span
                  className="text-5xl font-black tracking-tight tabular-nums"
                  style={{ color: category.color }}
                >
                  {data.aqi}
                </span>
              </div>
              <div
                className="px-3.5 py-1.5 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: category.bgColor,
                  borderColor: category.borderColor,
                  color: category.color,
                }}
              >
                {category.name}
              </div>
            </div>

            {/* Pollutants Mini Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">PM2.5</span>
                <span className="font-bold text-slate-200">
                  {data.pollutants.pm25 !== null ? `${data.pollutants.pm25} µg` : 'N/A'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">PM10</span>
                <span className="font-bold text-slate-200">
                  {data.pollutants.pm10 !== null ? `${data.pollutants.pm10} µg` : 'N/A'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Temp</span>
                <span className="font-bold text-slate-200">
                  {data.weather.temperature !== null ? `${Math.round(data.weather.temperature)}°C` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Health Tip */}
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-300 leading-snug">
              ⚠️ {category.generalAdvice}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50"
          >
            {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Exporting...' : 'Download PNG Card'}
          </button>
          <button
            onClick={handleShare}
            className="py-2.5 px-4 rounded-xl border border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-700 hover:bg-slate-800 light:hover:bg-slate-100 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Link Copied!' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
};
