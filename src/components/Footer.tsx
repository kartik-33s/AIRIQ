import React from 'react';
import { ExternalLink, ShieldCheck, Heart } from 'lucide-react';
import { AirIqBrandBadge } from './AirIqLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 bg-slate-950 light:bg-slate-100 border-t border-slate-800/80 light:border-slate-200 text-xs text-slate-400 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <AirIqBrandBadge size="sm" />
              <span className="text-base font-black text-slate-100 light:text-slate-900 tracking-tight">
                AirIQ Platform
              </span>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
              Real-time atmospheric intelligence platform ingesting verified ground-station telemetries
              and numerical atmospheric chemistry models to protect public health.
            </p>
          </div>

          {/* Integrated Data Providers */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 light:text-slate-800 uppercase tracking-wider text-[11px]">
              Authentic Data Sources
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a
                  href="https://waqi.info"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-400 flex items-center gap-1 transition-colors"
                >
                  WAQI / aqicn.org <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://openaq.org"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-400 flex items-center gap-1 transition-colors"
                >
                  OpenAQ Ground Stations <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-400 flex items-center gap-1 transition-colors"
                >
                  Open-Meteo Air Quality API <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-slate-400">Copernicus / CAMS Reanalysis</span>
              </li>
            </ul>
          </div>

          {/* Regulatory AQI Standards */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 light:text-slate-800 uppercase tracking-wider text-[11px]">
              Supported Standards
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>US EPA Clean Air Act (40 CFR Part 58)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>India CPCB National AQI (NAQI) Standard</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>World Health Organization (WHO) 2021 Air Targets</span>
              </li>
            </ul>
          </div>

          {/* Medical Notice */}
          <div className="space-y-2 md:col-span-1">
            <h4 className="font-bold text-slate-200 light:text-slate-800 uppercase tracking-wider text-[11px]">
              Health Advisory Notice
            </h4>
            <p className="text-[11px] text-slate-400 light:text-slate-600 leading-relaxed">
              AirIQ data is provided for public awareness and environmental intelligence. For specific clinical
              interventions, asthma action plans, or cardiovascular management, consult certified medical healthcare professionals.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 light:border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <span>© {new Date().getFullYear()} AirIQ Environmental Intelligence Platform. All rights reserved.</span>
          <span className="flex items-center gap-1 text-slate-500">
            Engineered with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for clean air and global public health.
          </span>
        </div>
      </div>
    </footer>
  );
};
