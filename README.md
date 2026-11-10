# AirIQ – Real-Time Air Quality Intelligence Platform

> **An enterprise-grade, real-time air quality intelligence platform that turns raw public atmospheric telemetry into clear, actionable public health insights.**

AirIQ seamlessly ingests multi-source ground-station telemetry (WAQI / OpenAQ) and numerical atmospheric reanalysis models (Open-Meteo & Copernicus) to deliver responsive, accurate, and life-saving environmental awareness.

---

## 📸 Screenshots & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  AirIQ [Live]   [Search global city...]  [US EPA | IN CPCB]  [AI Intel]│
├────────────────────────────────────────────────────────────────────────┤
│  Current Location: New Delhi, India • Station: Anand Vihar Ground Stn  │
│  [Measured Badge]  Updated 8 min ago • Source: WAQI Ground Station     │
│                                                                        │
│     ╭───────────╮   AQI: 248                                           │
│    │     248     │   Category: Very Poor / Very Unhealthy              │
│     ╰───────────╯   Dominant: PM2.5 (Fine Combustion Particles)        │
│                                                                        │
│  [PM2.5: 198 µg/m³]  [PM10: 312 µg/m³]  [NO2: 64 µg/m³]  [O3: 42 µg/m³]│
│  [Temp: 24°C]        [Humidity: 58%]    [Wind Speed: 11 km/h]          │
│                                                                        │
│  ✦ AI Atmospheric Summary (Gemini 3.8):                                │
│    "Temperature inversion currently trapping vehicular particulate     │
│    exhaust. Sensitive groups must remain indoors with HEPA air filters"│
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Feature Checklist

### Mandatory Requirements
- [x] **Live AQI Dashboard (Home)**:
  - City search with autocomplete & Geolocation API fallback.
  - Radial SVG gauge with needle/arc, category color-coding, dominant pollutant indicator, and health advice.
  - 6 individual pollutant cards (PM2.5, PM10, NO2, SO2, CO, O3) with severity bars, WHO limits, and clear `N/A` handling for missing parameters.
  - Weather metrics (temperature, relative humidity, wind speed).
  - Strict data provenance: "Measured", "Modeled estimate", or "Forecast" badge, source name, and relative timestamps ("12 min ago").
  - Auto-refresh toggle (every 5 minutes) and manual refresh.
- [x] **Interactive Air Quality Map**:
  - Full-width Leaflet map with custom color-coded AQI badges.
  - Automatic bounds query (`/api/aqi/map-bounds`) as the user pans or zooms.
  - Layer toggles: Station markers, Pollution Intensity Heatmap, and Hotspots.
  - Pulsing high-pollution beacons for severe/hazardous zones.
  - Slide-out station drawer on desktop and mobile bottom sheet.
  - "Top Polluted Nearby" and "Cleanest Air in View" quick selector panels.
- [x] **Historical Pollution Tracker**:
  - Date range filters: 7, 30, and 90 days.
  - Interactive Recharts Area & Line visualizations.
  - Statistical anomaly / spike detection using rolling mean + 2 standard deviations ($\mu + 2\sigma$).
  - Detailed spike events breakdown with deviation multiplier (e.g. `+3.4σ`) and atmospheric causation analysis.
  - Period-over-period percentage increase/decrease metric (`-14.2%` or `+25.3%`).
- [x] **Multi-Location Comparison**:
  - Side-by-side comparison for 2 to 5 global cities.
  - Pollutant matrix table.
  - Overlaid multi-line historical trend chart.
  - Differential ratio indicator (e.g., "Delhi is 3.1x higher AQI than Shimla").
  - "Relatively cleaner air" winner badge.
- [x] **Health & Safety Advisory**:
  - Full breakdown of all 6 AQI tiers for both US EPA and India CPCB standards.
  - Real-time dynamic activity guidance based on selected city's AQI:
    - Walking, jogging, and outdoor cardio
    - Cycling and commuting
    - Children's outdoor play and school recess
    - Windows & natural ventilation
    - N95/N99 respirator masks
    - Indoor HEPA air purifiers
  - Dedicated sensitive groups breakdown: Children, Elderly, Pregnant Women, Asthma/COPD, and Cardiovascular patients.
  - Educational deep-dive cards: PM2.5 vs PM10 microscopic size, penetration into alveoli, and systemic risks.
  - Prominent Medical Advice Disclaimer.
- [x] **AQI Forecast**:
  - 48-Hour hourly trajectory with dashed future line and shaded confidence envelope.
  - 7-Day daily forecast cards with peak predicted hours and best window of the day for outdoor activities.

### Bonus Features Implemented
- [x] **AI AQI Assistant**: Gemini 3.8 Flash server-side integration (`/api/ai/chat`) with suggested questions and current station telemetry context.
- [x] **Voice Assistant**: Web Speech API speech-to-text voice input and Text-to-Speech (TTS) readback.
- [x] **Smart AQI Alerts**: User-defined AQI threshold rules persisted in `localStorage` with browser Notification API integration and test alerts.
- [x] **AQI Sharing Cards**: Downloadable branded PNG summary graphic using `html-to-image` and native Web Share API.
- [x] **Pollution Impact Report**: Audit-grade printable assessment view (`window.print()`) formatted for A4 PDF export.
- [x] **Clean Air Finder**: Ranked nearby monitored stations with clean air.
- [x] **Standard Toggle**: Instant toggle between **US EPA (40 CFR Part 58)** and **India CPCB (NAQI)** breakpoints.
- [x] **Light & Dark Theme**: Responsive themes with system preference detection and manual toggle.

---

## 🌐 Public APIs & Data Sources

| Provider | Purpose | Authentication |
|---|---|---|
| **WAQI / aqicn.org** | Real-time ground station measurements & map bounds | `WAQI_TOKEN` (demo token included as fallback) |
| **Open-Meteo Air Quality** | Global hourly forecasts (7d), historical reanalysis (90d), modeled PM2.5, PM10, NO2, SO2, O3 | Free public API (No key required) |
| **Open-Meteo Weather** | Current temperature, humidity, wind speed | Free public API (No key required) |
| **Open-Meteo Geocoding** | Global city autocomplete search | Free public API (No key required) |
| **Google Gemini API** | Server-side AI intelligence bulletin & contextual chat assistant | `GEMINI_API_KEY` via `@google/genai` |
| **OpenAQ v3** | Official governmental air quality telemetry | `OPENAQ_API_KEY` |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Visualizations**: Leaflet 1.9 (interactive maps), Recharts (time-series, overlays & confidence envelopes)
- **Exporting**: `html-to-image` (PNG generation)
- **Backend**: Node.js, Express, Vite middleware mode, `@google/genai`
- **Testing**: Node.js built-in test runner (`node:test`, `node:assert/strict`) via `tsx --test`

---

## 🚀 Setup & Installation

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the environment variables (see table below).

### 3. Run Unit Tests
Verify pure AQI math, EPA/CPCB breakpoints, and spike detection:
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional (for AI) | Google Gemini API key for server-side AI chat and insights. Injected in AI Studio secrets. |
| `WAQI_TOKEN` | Optional | API token for WAQI ground stations. Falls back to public `demo` token if empty. |
| `OPENAQ_API_KEY` | Optional | API key for OpenAQ v3 ground measurements. |
| `APP_URL` | Optional | Hosted application URL. |

---

## ⚠️ Known Limitations
- In remote oceanic or rural locations without ground monitoring stations, air quality values are derived from European & GFS numerical atmospheric dispersion models (accurately badged as "Modeled estimate").
- Browser notifications require explicit user permission and HTTPS/localhost context.

---

- **[2:05 - 2:30] Health Guidance, AI Assistant & Card Sharing**:
  "Under Health & Safety, dynamic recommendations adapt to current pollution levels, specifying mask guidance and sensitive group advisories. Users can open the Gemini AI Assistant for personalized guidance with voice input, configure Smart AQI threshold notifications, and export a branded PNG share card or printable PDF impact report."
