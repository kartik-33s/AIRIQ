import React, { useState } from 'react';
import {
  HeartPulse,
  ShieldAlert,
  Wind,
  Smile,
  AlertTriangle,
  AlertOctagon,
  Activity,
  CheckCircle,
  XCircle,
  HelpCircle,
  Baby,
  UserCheck,
  Stethoscope,
} from 'lucide-react';
import { LocationData, AqiStandard } from '../types/aqi';
import { getAqiCategory } from '../lib/aqi';

interface HealthViewProps {
  currentLocation: LocationData | null;
  standard: AqiStandard;
}

export const HealthView: React.FC<HealthViewProps> = ({ currentLocation, standard }) => {
  const [activeGroup, setActiveGroup] = useState<'children' | 'elderly' | 'respiratory' | 'cardio'>('respiratory');

  const currentAqi = currentLocation?.aqi ?? 45;
  const currentCategory = getAqiCategory(currentAqi, standard);

  // All 6 categories for reference
  const allCategories = [
    {
      range: '0 - 50',
      name: 'Good',
      color: '#10b981',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      desc: 'Air quality is satisfactory, and air pollution poses little or no risk.',
      precautions: 'Enjoy outdoor sports and ventilate living spaces freely.',
    },
    {
      range: '51 - 100',
      name: standard === 'US_EPA' ? 'Moderate' : 'Satisfactory',
      color: '#f59e0b',
      bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      desc: 'Air quality is acceptable; unusually sensitive individuals may experience minor irritation.',
      precautions: 'Extremely sensitive individuals should monitor throat or lung symptoms during prolonged exertion.',
    },
    {
      range: standard === 'US_EPA' ? '101 - 150' : '101 - 200',
      name: standard === 'US_EPA' ? 'Unhealthy for Sensitive Groups' : 'Moderate',
      color: '#f97316',
      bgColor: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      desc: 'Sensitive individuals may experience health effects. General public is less likely to be affected.',
      precautions: 'Children, older adults, and those with respiratory issues should limit prolonged outdoor exercise.',
    },
    {
      range: standard === 'US_EPA' ? '151 - 200' : '201 - 300',
      name: standard === 'US_EPA' ? 'Unhealthy' : 'Poor',
      color: '#ef4444',
      bgColor: 'bg-red-500/10 border-red-500/30 text-red-400',
      desc: 'Everyone may begin to experience health effects; sensitive groups may experience more serious effects.',
      precautions: 'Wear N95/N99 respirators outdoors. Avoid outdoor running or cycling. Keep windows closed.',
    },
    {
      range: standard === 'US_EPA' ? '201 - 300' : '301 - 400',
      name: standard === 'US_EPA' ? 'Very Unhealthy' : 'Very Poor',
      color: '#a855f7',
      bgColor: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      desc: 'Health alert: Risk of health effects is heightened for the entire population.',
      precautions: 'Remain indoors. Run certified HEPA air filtration. Avoid all vigorous outdoor activities.',
    },
    {
      range: standard === 'US_EPA' ? '301 - 500+' : '401 - 500+',
      name: standard === 'US_EPA' ? 'Hazardous' : 'Severe',
      color: '#881337',
      bgColor: 'bg-rose-950/40 border-rose-700/50 text-rose-300',
      desc: 'Emergency health warning: Entire population is at high risk of severe physiological distress.',
      precautions: 'Strict indoor confinement. Seal doors/windows. Use clinical-grade air purification.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 light:border-slate-200">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-rose-400" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 light:text-slate-900 tracking-tight">
            Health & Safety Advisory Dashboard
          </h2>
        </div>
        <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
          Actionable biomedical guidelines, activity planning, and clinical vulnerability breakdowns for{' '}
          <strong className="text-slate-200 light:text-slate-700">{currentLocation?.city}</strong>.
        </p>
      </div>

      {/* Current Real-Time Activity Recommendations */}
      <div className="p-6 rounded-2xl bg-slate-900/90 light:bg-white border border-slate-800 light:border-slate-200 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 block">
              Active Location Assessment
            </span>
            <h3 className="text-lg font-black text-slate-100 light:text-slate-900">
              Current Air Quality: {currentCategory.name} (AQI {currentAqi})
            </h3>
          </div>
          <div
            className="px-4 py-1.5 rounded-full text-xs font-bold border self-start sm:self-auto"
            style={{
              backgroundColor: currentCategory.bgColor,
              borderColor: currentCategory.borderColor,
              color: currentCategory.color,
            }}
          >
            {currentCategory.name}
          </div>
        </div>

        {/* Dynamic Activity Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Walking & Running */}
          <div className="p-4 rounded-xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 light:text-slate-800">
                Walking, Jogging & Running
              </span>
              {currentCategory.level <= 2 ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : currentCategory.level === 3 ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <p className="text-slate-400 light:text-slate-600 leading-relaxed">
              {currentCategory.level <= 2
                ? 'Ideal conditions for aerobic workouts, jogging, and outdoor cardio training.'
                : currentCategory.level === 3
                ? 'Healthy individuals can continue outdoor exercise, but limit intense long-distance sprints.'
                : 'Avoid vigorous outdoor running. Heavy breathing dramatically increases deep alveolar PM2.5 deposition.'}
            </p>
          </div>

          {/* Cycling & Commuting */}
          <div className="p-4 rounded-xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 light:text-slate-800">Cycling & Commuting</span>
              {currentCategory.level <= 2 ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <p className="text-slate-400 light:text-slate-600 leading-relaxed">
              {currentCategory.level <= 2
                ? 'Safe for bike commuting. Ambient air contains minimal particulate matter.'
                : currentCategory.level <= 4
                ? 'Wear a fitted N95 respirator when cycling near busy arterial roads and heavy truck corridors.'
                : 'Shift to closed vehicle transit or metro rail with internal filtration.'}
            </p>
          </div>

          {/* Children Playground */}
          <div className="p-4 rounded-xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 light:text-slate-800">Children Outdoor Play</span>
              {currentCategory.level === 1 ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : currentCategory.level <= 3 ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <p className="text-slate-400 light:text-slate-600 leading-relaxed">
              {currentCategory.level === 1
                ? 'Safe for unstructured outdoor play, school recess, and sports.'
                : currentCategory.level <= 3
                ? 'Keep recess durations shorter. Encourage hydration and rest breaks.'
                : 'Keep children indoors. Developing pediatric respiratory airways are highly sensitive to acute inflammation.'}
            </p>
          </div>

          {/* Windows & Home Ventilation */}
          <div className="p-4 rounded-xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 light:text-slate-800">Natural Ventilation</span>
              {currentCategory.windowOpen ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <p className="text-slate-400 light:text-slate-600 leading-relaxed">
              {currentCategory.windowOpen
                ? 'Open windows to flush stale indoor CO2 and introduce fresh air.'
                : 'Keep windows and doors securely sealed to prevent outdoor smog penetration. Run HEPA air purifiers.'}
            </p>
          </div>

          {/* Mask Recommendations */}
          <div className="p-4 rounded-xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 light:text-slate-800">Respirator Mask</span>
              {currentCategory.maskRecommended ? (
                <AlertOctagon className="w-4 h-4 text-amber-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <p className="text-slate-400 light:text-slate-600 leading-relaxed">
              {currentCategory.maskRecommended
                ? 'Certified N95, N99, or FFP2 respirators recommended outdoors. Cloth masks do not filter fine PM2.5.'
                : 'No protective respiratory mask is required under current atmospheric conditions.'}
            </p>
          </div>

          {/* Air Purifiers */}
          <div className="p-4 rounded-xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 light:text-slate-800">Indoor Air Purifiers</span>
              {currentCategory.level >= 3 ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <Activity className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <p className="text-slate-400 light:text-slate-600 leading-relaxed">
              {currentCategory.level >= 3
                ? 'Activate True HEPA (H13/H14) filtration with activated carbon layer for VOC adsorption.'
                : 'Standard low-speed indoor circulation is sufficient.'}
            </p>
          </div>
        </div>
      </div>

      {/* Sensitive & Vulnerable Groups Tabbed Section */}
      <div className="p-6 rounded-2xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 shadow-md space-y-5">
        <div>
          <h3 className="text-base font-bold text-slate-100 light:text-slate-900">
            Dedicated Guidance for High-Risk Groups
          </h3>
          <p className="text-xs text-slate-400">
            Biological vulnerabilities dictate stricter thresholds for vulnerable physiology.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-800 light:border-slate-200 pb-3 -mx-1 px-1">
          <button
            onClick={() => setActiveGroup('respiratory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 min-h-[38px] touch-manipulation whitespace-nowrap ${
              activeGroup === 'respiratory'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-slate-700'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" /> Asthma & COPD
          </button>
          <button
            onClick={() => setActiveGroup('cardio')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 min-h-[38px] touch-manipulation whitespace-nowrap ${
              activeGroup === 'cardio'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-slate-700'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" /> Cardiovascular Disease
          </button>
          <button
            onClick={() => setActiveGroup('children')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 min-h-[38px] touch-manipulation whitespace-nowrap ${
              activeGroup === 'children'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-slate-700'
            }`}
          >
            <Baby className="w-3.5 h-3.5" /> Children & Infants
          </button>
          <button
            onClick={() => setActiveGroup('elderly')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 min-h-[38px] touch-manipulation whitespace-nowrap ${
              activeGroup === 'elderly'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Elderly & Pregnant Women
          </button>
        </div>

        {/* Tab Content */}
        <div className="text-xs text-slate-300 light:text-slate-600 leading-relaxed space-y-3">
          {activeGroup === 'respiratory' && (
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-sky-400">Asthma, Bronchitis & COPD Patients</h4>
              <p>
                Inhaled microscopic fine particulate matter (PM2.5) and Nitrogen Dioxide (NO2) induce
                acute bronchial constriction, hyper-responsiveness, and pulmonary inflammation.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Keep rapid-relief bronchodilator inhalers (e.g. Salbutamol) readily accessible at all times.</li>
                <li>Monitor peak expiratory flow (PEF) readings when AQI rises above 100.</li>
                <li>Avoid outdoor morning walks, when nocturnal thermal inversion traps vehicle exhaust near the ground.</li>
              </ul>
            </div>
          )}

          {activeGroup === 'cardio' && (
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-rose-400">Hypertension, Angina & Heart Disease</h4>
              <p>
                Ultra-fine particles penetrate lung alveoli into the blood circulation, triggering systemic
                arterial inflammation, endothelial dysfunction, elevated blood pressure, and increased thrombotic risk.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>High-pollution days correlate with increased incidence of ischemic stroke and myocardial infarction.</li>
                <li>Avoid strenuous exertion outdoors when AQI exceeds 150.</li>
                <li>Report chest tightness, palpitations, or atypical shortness of breath immediately.</li>
              </ul>
            </div>
          )}

          {activeGroup === 'children' && (
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-amber-400">Pediatric Physiology (Children & Infants)</h4>
              <p>
                Children breathe more air per kilogram of body weight than adults and possess developing lungs
                with lower immune resistance to particulate insults.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Prolonged chronic exposure to high PM2.5 retards lung capacity growth and increases lifetime asthma risk.</li>
                <li>Schools should restrict outdoor physical education when AQI exceeds 150.</li>
              </ul>
            </div>
          )}

          {activeGroup === 'elderly' && (
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-emerald-400">Elderly & Expectant Mothers</h4>
              <p>
                Diminished cardiovascular reserve in older adults and maternal-fetal oxygen transfer vulnerability
                make both groups susceptible to airborne oxidative stress.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Expectant mothers exposed to chronic particulate pollution face heightened risk of low birth weight.</li>
                <li>Maintain clean indoor air with closed windows and HEPA filtration during seasonal smog waves.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Educational Deep Dive: PM2.5 vs PM10 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              2.5
            </span>
            <div>
              <h4 className="font-bold text-slate-100 light:text-slate-900 text-sm">
                PM2.5 (Fine Combustion Particles)
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Diameter &lt; 2.5 micrometers</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 light:text-slate-600 leading-relaxed">
            Approximately <strong>30 times smaller</strong> than the width of a single human hair.
            Generated primarily by vehicular combustion, thermal power generation, industrial emissions, and biomass burning.
            Due to their microscopic size, PM2.5 particles bypass the nose and throat filters, penetrating deep into the
            bronchioles and crossing directly into the bloodstream.
          </p>
          <div className="text-[11px] text-slate-400 bg-slate-800/50 light:bg-slate-50 p-2.5 rounded-lg border border-slate-700/50 light:border-slate-200">
            <strong>Key Risks:</strong> Systemic inflammation, premature cardiovascular mortality, COPD, and lung cancer.
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              10
            </span>
            <div>
              <h4 className="font-bold text-slate-100 light:text-slate-900 text-sm">
                PM10 (Respirable Coarse Dust)
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Diameter &lt; 10 micrometers</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 light:text-slate-600 leading-relaxed">
            Consists of mechanical dust, construction debris, road dust re-suspension, pollen, and industrial fly ash.
            Deposits in the upper respiratory tract, nasopharynx, and trachea. Triggers persistent coughing, throat burning,
            eye irritation, and allergic rhinitis.
          </p>
          <div className="text-[11px] text-slate-400 bg-slate-800/50 light:bg-slate-50 p-2.5 rounded-lg border border-slate-700/50 light:border-slate-200">
            <strong>Key Risks:</strong> Upper airway irritation, chronic bronchitis exacerbation, and sinus inflammation.
          </div>
        </div>
      </div>

      {/* Category Reference Guide */}
      <div className="p-6 rounded-2xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-100 light:text-slate-900">
          Official AQI Category Scale & Standard Benchmarks ({standard === 'US_EPA' ? 'US EPA' : 'India CPCB'})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allCategories.map((cat, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-800/40 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 light:text-slate-900">{cat.name}</span>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] border ${cat.bgColor}`}>
                  {cat.range}
                </span>
              </div>
              <p className="text-slate-400 light:text-slate-600 text-[11px]">{cat.desc}</p>
              <p className="text-slate-300 light:text-slate-700 font-medium text-[11px] pt-1 border-t border-slate-800 light:border-slate-200">
                ⚠️ {cat.precautions}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Medical Advice Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-center text-xs text-slate-400 light:text-slate-600 space-y-1">
        <p className="font-bold text-slate-300 light:text-slate-800">Medical Advice Disclaimer</p>
        <p className="max-w-2xl mx-auto text-[11px] leading-relaxed">
          AirIQ synthesizes ambient atmospheric telemetry and public health recommendations from the WHO and EPA.
          This platform does not provide individualized clinical diagnostics or replace personalized medical counsel.
          Patients experiencing acute cardiopulmonary symptoms should consult a licensed physician or emergency medical provider immediately.
        </p>
      </div>
    </div>
  );
};
