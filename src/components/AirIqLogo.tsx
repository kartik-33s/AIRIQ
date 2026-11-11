import React from 'react';

interface AirIqIconProps {
  className?: string;
  size?: number;
}

export const AirIqIcon: React.FC<AirIqIconProps> = ({ className = 'w-6 h-6', size = 24 }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      role="img"
      aria-label="AirIQ Environmental Intelligence Emblem"
    >
      <defs>
        <linearGradient id="airiq-vortex" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="airiq-core-glow" x1="12" y1="12" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <filter id="airiq-drop-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#38bdf8" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Atmospheric Orbit Outer Ring & Airflow Streamlines */}
      <path
        d="M6 16C6 10.477 10.477 6 16 6C20.418 6 24.167 8.857 25.485 12.85"
        stroke="url(#airiq-vortex)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M26 16C26 21.523 21.523 26 16 26C11.582 26 7.833 23.143 6.515 19.15"
        stroke="url(#airiq-vortex)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Aerodynamic Swirl / Wind Flow Curvature */}
      <path
        d="M10 16C10 13.5 12.2 11.5 15 12C18.2 12.6 19.5 15.5 18.2 18.2C17.2 20.2 14.8 20.8 12.8 19.5"
        stroke="url(#airiq-vortex)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Intelligence Sensor Node & Optic Reticle */}
      <circle
        cx="16"
        cy="16"
        r="2.6"
        fill="url(#airiq-core-glow)"
        filter="url(#airiq-drop-glow)"
      />
      <circle cx="16" cy="16" r="4.2" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.75" />

      {/* Cardinal Calibration Spikes */}
      <path
        d="M16 2.5V4.5M16 27.5V29.5M2.5 16H4.5M27.5 16H29.5"
        stroke="url(#airiq-vortex)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const AirIqBrandBadge: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const containerClasses =
    size === 'sm'
      ? 'w-7 h-7 rounded-lg'
      : size === 'lg'
      ? 'w-11 h-11 rounded-2xl'
      : 'w-8 h-8 sm:w-10 sm:h-10 rounded-xl';

  const iconClasses =
    size === 'sm'
      ? 'w-4 h-4'
      : size === 'lg'
      ? 'w-7 h-7'
      : 'w-5 h-5 sm:w-6 sm:h-6';

  return (
    <div
      className={`${containerClasses} bg-gradient-to-tr from-slate-950 via-slate-900 to-sky-950 border border-sky-500/30 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:border-sky-400/50 transition-all`}
    >
      <AirIqIcon className={`${iconClasses} text-white drop-shadow`} />
    </div>
  );
};
