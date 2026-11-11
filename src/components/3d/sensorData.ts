export type SensorPartId =
  | 'nephelometer'
  | 'radiometer'
  | 'anemometer'
  | 'gas_analyzer'
  | 'solar'
  | 'beacon'
  | 'avionics'
  | 'pedestal';

export interface SensorInfo {
  id: SensorPartId;
  name: string;
  shortLabel: string;
  category: 'Aerosol' | 'Radiation' | 'Meteorology' | 'Chemistry' | 'Power' | 'Telemetry';
  subtitle: string;
  principle: string;
  techSpecs: {
    label: string;
    value: string;
  }[];
  primaryMetricName: string;
  unit: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

export const STATION_SENSORS: Record<SensorPartId, SensorInfo> = {
  nephelometer: {
    id: 'nephelometer',
    name: 'Laser Optical Particulate Nephelometer',
    shortLabel: 'PM2.5 / PM10 Laser',
    category: 'Aerosol',
    subtitle: 'High-precision forward Mie laser scattering chamber',
    principle:
      'A continuous 650nm semiconductor laser diode illuminates ambient air sampled through a cyclonic size-selective inlet. Photodiodes measure angle-dependent scattered light to count and size individual aerosol particles into PM1.0, PM2.5, and PM10 fractions.',
    techSpecs: [
      { label: 'Optical Wavelength', value: '650 nm ± 5 nm' },
      { label: 'Measurement Range', value: '0.1 – 1,000 µg/m³' },
      { label: 'Sample Flow Rate', value: '1.0 L/min' },
      { label: 'Resolution', value: '0.1 µg/m³' },
      { label: 'Zero Drift', value: '< ±1.5 µg/m³ / 30d' },
    ],
    primaryMetricName: 'PM2.5 Mass Concentration',
    unit: 'µg/m³',
    cameraPos: [-3.2, 5.2, 3.2],
    cameraTarget: [-1.0, 4.4, 0.6],
  },

  radiometer: {
    id: 'radiometer',
    name: 'Solar Pyranometer & UV Spectroradiometer',
    shortLabel: 'Solar UV & Flux',
    category: 'Radiation',
    subtitle: 'Hemispherical shortwave flux & erythemal UV irradiance',
    principle:
      'Features a precision optical quartz dome housing a thermoelectric thermopile detector paired with an interference-filtered silicon photodiode. Quantifies global solar irradiance (W/m²) and erythemal action spectrum UV Index.',
    techSpecs: [
      { label: 'Spectral Range', value: '280 nm – 3000 nm' },
      { label: 'Cosine Response', value: '< 1% up to 80° zenith' },
      { label: 'Response Time (95%)', value: '< 1.2 seconds' },
      { label: 'Operating Temp', value: '-40°C to +80°C' },
      { label: 'Sensitivity', value: '10 µV / (W/m²)' },
    ],
    primaryMetricName: 'Solar UV Index & Irradiance',
    unit: 'UVI / W/m²',
    cameraPos: [3.4, 6.2, 3.0],
    cameraTarget: [1.3, 5.38, 0.5],
  },

  anemometer: {
    id: 'anemometer',
    name: 'Tri-Axial Ultrasonic Wind Anemometer',
    shortLabel: '3D Wind Vector',
    category: 'Meteorology',
    subtitle: 'Sonic transit-time aerodynamic vector array with zero moving friction',
    principle:
      'Three pairs of piezoelectric ultrasonic transducers send high-frequency sound pulses across opposing acoustic paths. By calculating the transit time differential in microseconds, the sensor computes instantaneous wind speed and 360° directional azimuth without mechanical inertia.',
    techSpecs: [
      { label: 'Wind Speed Range', value: '0 – 60 m/s (216 km/h)' },
      { label: 'Directional Range', value: '0° to 359.9° continuous' },
      { label: 'Speed Accuracy', value: '±0.05 m/s or 2%' },
      { label: 'Direction Accuracy', value: '±1.2°' },
      { label: 'Sampling Rate', value: '10 Hz (100 ms)' },
    ],
    primaryMetricName: 'Wind Velocity & Azimuth',
    unit: 'km/h',
    cameraPos: [1.8, 7.8, 2.8],
    cameraTarget: [0, 6.8, 0],
  },

  gas_analyzer: {
    id: 'gas_analyzer',
    name: 'Multi-Gas Electrochemical Micro-Array',
    shortLabel: 'Trace Gas Chamber',
    category: 'Chemistry',
    subtitle: 'Four-electrode amperometric cells for reactive gaseous smog precursors',
    principle:
      'Ambient air diffuses across a gas-permeable membrane into electrolyte chambers. Target molecules (NO₂, SO₂, CO, and O₃) undergo redox oxidation/reduction at working electrodes, generating nanoampere electrical currents proportional to volume fraction.',
    techSpecs: [
      { label: 'Target Gases', value: 'NO₂, SO₂, CO, Ground O₃' },
      { label: 'Detection Limit (NO₂)', value: '< 5 ppb' },
      { label: 'Temperature Comp.', value: 'Active dual-PT100' },
      { label: 'Baseline Stability', value: '< 2 ppb/year' },
    ],
    primaryMetricName: 'Reactive Toxic Smog Gases',
    unit: 'ppb / mg/m³',
    cameraPos: [-2.2, 4.8, -2.6],
    cameraTarget: [-0.6, 4.4, -0.6],
  },

  solar: {
    id: 'solar',
    name: 'Monocrystalline Solar Wing & LiFePO4 Module',
    shortLabel: 'Solar Power System',
    category: 'Power',
    subtitle: 'Autonomous off-grid power generation with MPPT controller',
    principle:
      'High-efficiency bifacial silicon photovoltaic cells provide continuous operating power to the sensor payload while charging an internal Lithium Iron Phosphate (LiFePO4) cold-weather battery bank capable of 7-day zero-sunlight endurance.',
    techSpecs: [
      { label: 'Nominal Peak Power', value: '45 Watts' },
      { label: 'Cell Efficiency', value: '23.4%' },
      { label: 'Battery Capacity', value: '180 Wh LiFePO4' },
      { label: 'Autonomy Window', value: '168 hours (7 days)' },
    ],
    primaryMetricName: 'Photovoltaic Harvest',
    unit: 'Watts',
    cameraPos: [0, 6.0, -3.8],
    cameraTarget: [0, 4.6, -1.2],
  },

  beacon: {
    id: 'beacon',
    name: '360° Real-Time AQI Optical Halo',
    shortLabel: 'Status Beacon',
    category: 'Telemetry',
    subtitle: 'Dynamic volumetric chromatic signaling ring',
    principle:
      'High-output RGBW LED array with diffusing frosted silicone optical guide. Shifts color dynamically from Green (Good) to Amber (Moderate), Red (Unhealthy), Purple (Very Unhealthy), and Maroon (Hazardous 300+ / 500 cap).',
    techSpecs: [
      { label: 'Luminous Flux', value: '450 Lumens' },
      { label: 'Color Space', value: 'ITU-R BT.709 sRGB' },
      { label: 'Pulse Frequency', value: '0.5 – 2.0 Hz alert cadence' },
    ],
    primaryMetricName: 'Visual Threat Indicator',
    unit: 'Chromatic AQI',
    cameraPos: [2.8, 6.4, 2.6],
    cameraTarget: [0, 5.25, 0],
  },

  avionics: {
    id: 'avionics',
    name: 'Edge AI Compute & Satellite Telemetry Hub',
    shortLabel: 'Edge AI Computer',
    category: 'Telemetry',
    subtitle: 'ARM Cortex telemetry processor running European Copernicus CAMS validation',
    principle:
      'Aggregates sensor ADC outputs, computes rolling EPA/CPCB standard averages, detects anomalous baseline spikes (+2σ), and syncs encrypted packets every 60 seconds via NB-IoT cellular and Low-Earth-Orbit satellite transceivers.',
    techSpecs: [
      { label: 'Processor', value: 'Quad-Core 64-bit ARM 1.5 GHz' },
      { label: 'Telemetry Uplink', value: 'NB-IoT / LTE-M / LEO Satellite' },
      { label: 'Model Verification', value: 'Copernicus CAMS 11km Regional' },
      { label: 'Firmware OS', value: 'AirIQ Secure RTOS' },
    ],
    primaryMetricName: 'Telemetry Sync Status',
    unit: '100% Operational',
    cameraPos: [0, 5.0, 3.4],
    cameraTarget: [0, 4.4, 0],
  },

  pedestal: {
    id: 'pedestal',
    name: 'Reinforced Vibration-Damped Concrete Foundation',
    shortLabel: 'Base Foundation',
    category: 'Telemetry',
    subtitle: 'Heavy octagonal structural anchor with steel seismic ground pins',
    principle:
      'Massive 2.6-meter octagonal reinforced aggregate pedestal engineered to isolate delicate optical laser benches and ultrasonic transducers from high-traffic vehicular ground vibrations.',
    techSpecs: [
      { label: 'Compressive Strength', value: '45 MPa' },
      { label: 'Anchor Bolts', value: '8x Grade 8.8 M20 Stainless' },
      { label: 'Vibration Isolation', value: '> 94% above 8 Hz' },
    ],
    primaryMetricName: 'Structural Integrity',
    unit: 'Calibrated',
    cameraPos: [3.8, 2.2, 4.4],
    cameraTarget: [0, 0.4, 0],
  },
};
