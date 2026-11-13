import React from 'react';
import { Map, Box, Sparkles, FileText } from 'lucide-react';
import { CinematicFooter } from '@/components/ui/motion-footer';
import { ActiveTab } from '../types/aqi';

interface FooterProps {
  onSelectTab?: (tab: ActiveTab) => void;
  onOpenAiAssistant?: () => void;
  onOpenReport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenAiAssistant,
  onOpenReport,
}) => {
  const navigateTo = (tab: ActiveTab) => {
    onSelectTab?.(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <CinematicFooter
      brandName="AirIQ Environmental Intelligence"
      giantText="AIRIQ"
      heading="Breathe with clarity."
      subtitle="Real-time atmospheric telemetry from verified ground stations, Copernicus reanalysis, and clinical US EPA & India CPCB standards."
      marqueeItems={[
        'Real-Time Telemetry',
        'US EPA & India CPCB',
        'WHO 2021 Targets',
        'Atmospheric 3D Twin',
        'Clinical Health Advisories',
      ]}
      primaryActions={[
        {
          label: 'Interactive Map',
          icon: <Map className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />,
          onClick: () => navigateTo('map'),
        },
        {
          label: 'Explore 3D Twin',
          icon: <Box className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />,
          onClick: () => navigateTo('3d'),
        },
        {
          label: 'Ask AI Intel',
          icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />,
          onClick: onOpenAiAssistant,
        },
        {
          label: 'Impact Report',
          icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />,
          onClick: onOpenReport,
        },
      ]}
      secondaryLinks={[
        { label: 'WAQI / aqicn.org', href: 'https://waqi.info', external: true },
        { label: 'OpenAQ Stations', href: 'https://openaq.org', external: true },
        { label: 'Open-Meteo Air API', href: 'https://open-meteo.com', external: true },
        { label: 'Health Guide', onClick: () => navigateTo('health') },
      ]}
      craftedLabel="Let's Code community"
    />
  );
};
