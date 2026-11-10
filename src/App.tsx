import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, AqiStandard, LocationData } from './types/aqi';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { DashboardView } from './views/DashboardView';
import { MapView } from './views/MapView';
import { HistoryView } from './views/HistoryView';
import { ForecastView } from './views/ForecastView';
import { ComparisonView } from './views/ComparisonView';
import { HealthView } from './views/HealthView';
import { Atmospheric3DView } from './views/Atmospheric3DView';
import { AiAssistantModal } from './components/AiAssistantModal';
import { SmartAlertsModal } from './components/SmartAlertsModal';
import { ReportModal } from './components/ReportModal';
import { ShareCardModal } from './components/ShareCardModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [standard, setStandard] = useState<AqiStandard>('US_EPA');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('airiq_theme');
      if (saved === 'light') return false;
      if (saved === 'dark') return true;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return false;
      }
    } catch {
      // fallback
    }
    return true;
  });
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Initialize standard from localStorage
  useEffect(() => {
    const savedStd = localStorage.getItem('airiq_standard') as AqiStandard;
    if (savedStd === 'US_EPA' || savedStd === 'INDIA_CPCB') {
      setStandard(savedStd);
    }
  }, []);

  // Update theme class on HTML element & body
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.remove('light');
      root.classList.add('dark');
      document.body.classList.remove('light');
      document.body.classList.add('dark');
      try {
        localStorage.setItem('airiq_theme', 'dark');
      } catch {}
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      try {
        localStorage.setItem('airiq_theme', 'light');
      } catch {}
    }
  }, [darkMode]);

  // Save standard preference
  const handleSetStandard = (std: AqiStandard) => {
    setStandard(std);
    localStorage.setItem('airiq_standard', std);
  };

  // Fetch live AQI data by city or coordinates
  // Fetch live AQI data by coordinates or city
  const fetchLiveAqi = useCallback(
    async (params: { city?: string; lat?: number; lng?: number }, isManual = false) => {
      if (isManual) setIsRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        let url = `/api/aqi/live?standard=${standard}`;
        if (params.lat !== undefined && params.lng !== undefined) {
          url += `&lat=${params.lat}&lng=${params.lng}`;
          if (params.city) {
            url += `&city=${encodeURIComponent(params.city)}`;
          }
        } else if (params.city) {
          url += `&city=${encodeURIComponent(params.city)}`;
        } else {
          url += `&city=Delhi`;
        }

        const resp = await fetch(url);
        if (!resp.ok) {
          throw new Error(`Data service responded with status ${resp.status}`);
        }
        const data = await resp.json();
        setLocationData(data);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || 'Failed to retrieve live atmospheric telemetry.');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [standard]
  );

  // Detect user's exact current location via multi-tier Geolocation (High-accuracy GPS -> Network Triangulation -> IP Fallback)
  const handleUseCurrentLocation = useCallback(() => {
    setIsLocating(true);
    setLoading(true);
    setError(null);

    const onCoordsFound = async (lat: number, lng: number, fallbackCity?: string) => {
      setIsLocating(false);
      let clientResolvedCity = fallbackCity || '';
      try {
        const bgResp = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        if (bgResp.ok) {
          const bgData = await bgResp.json();
          const loc = bgData.locality || bgData.city || bgData.principalSubdivision;
          const country = bgData.countryName || '';
          if (loc) {
            clientResolvedCity = country ? `${loc}, ${country}` : loc;
          }
        }
      } catch {
        // Fall back to server-side reverse geocoding
      }

      fetchLiveAqi({ lat, lng, city: clientResolvedCity || undefined });
    };

    if ('geolocation' in navigator) {
      // 1. Try High Accuracy (GPS hardware / Wi-Fi BSSID)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onCoordsFound(pos.coords.latitude, pos.coords.longitude);
        },
        (highAccErr) => {
          console.warn('High-accuracy GPS timed out or unavailable, trying network positioning:', highAccErr?.message);
          // 2. Try Low Accuracy (OS cellular / IP triangulation - instant on laptops/desktops)
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              onCoordsFound(pos.coords.latitude, pos.coords.longitude);
            },
            async (lowAccErr) => {
              console.warn('Standard geolocation also unavailable, checking client IP:', lowAccErr?.message);
              // 3. Client-side IP Geolocation directly from user's browser
              try {
                const ipClientResp = await fetch('https://ipwho.is/');
                const ipClientData = await ipClientResp.json();
                if (ipClientData && ipClientData.success && typeof ipClientData.latitude === 'number') {
                  const detectedCity = `${ipClientData.city || ipClientData.region || 'Local Area'}, ${ipClientData.country || ''}`;
                  onCoordsFound(ipClientData.latitude, ipClientData.longitude, detectedCity);
                  return;
                }
              } catch {
                // Silently try server fallback
              }

              // 4. Server-side detect-location endpoint
              try {
                const srvResp = await fetch('/api/aqi/detect-location');
                const srvData = await srvResp.json();
                if (srvData && srvData.lat && srvData.lng) {
                  onCoordsFound(srvData.lat, srvData.lng, srvData.city);
                  return;
                }
              } catch {
                // Silently continue
              } finally {
                setIsLocating(false);
              }

              // 5. Final fallback
              fetchLiveAqi({ city: 'Delhi' });
            },
            {
              enableHighAccuracy: false,
              timeout: 6000,
              maximumAge: 60000,
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 10000,
        }
      );
    } else {
      fetch('/api/aqi/detect-location')
        .then((r) => r.json())
        .then((geo) => {
          if (geo?.lat && geo?.lng) fetchLiveAqi({ lat: geo.lat, lng: geo.lng, city: geo.city });
          else fetchLiveAqi({ city: 'Delhi' });
        })
        .catch(() => fetchLiveAqi({ city: 'Delhi' }))
        .finally(() => setIsLocating(false));
    }
  }, [fetchLiveAqi]);

  // Initial load
  useEffect(() => {
    handleUseCurrentLocation();
  }, [handleUseCurrentLocation]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 light:bg-slate-50 light:text-slate-900 transition-colors">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        standard={standard}
        setStandard={handleSetStandard}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onSearchCity={(city, coords) => {
          if (coords) {
            fetchLiveAqi({ lat: coords.lat, lng: coords.lng, city });
          } else {
            fetchLiveAqi({ city });
          }
        }}
        onUseCurrentLocation={handleUseCurrentLocation}
        onOpenAiAssistant={() => setIsAiOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onRefresh={() => {
          if (locationData?.coordinates) {
            fetchLiveAqi(
              {
                lat: locationData.coordinates.lat,
                lng: locationData.coordinates.lng,
                city: locationData.city,
              },
              true
            );
          } else {
            fetchLiveAqi({ city: locationData?.city || 'Delhi' }, true);
          }
        }}
        isRefreshing={isRefreshing}
        isLocating={isLocating}
        currentLocation={locationData}
      />

      {/* Main Tab View */}
      <main className="flex-1 pb-16 md:pb-0">
        {activeTab === 'dashboard' && (
          <DashboardView
            data={locationData}
            loading={loading}
            error={error}
            standard={standard}
            onRefresh={() => {
              if (locationData?.coordinates) {
                fetchLiveAqi(
                  { lat: locationData.coordinates.lat, lng: locationData.coordinates.lng },
                  true
                );
              } else {
                fetchLiveAqi({ city: locationData?.city || 'Delhi' }, true);
              }
            }}
            isRefreshing={isRefreshing}
            isLocating={isLocating}
            onSelectCity={(city) => fetchLiveAqi({ city })}
            onUseCurrentLocation={handleUseCurrentLocation}
            onOpenAiAssistant={() => setIsAiOpen(true)}
            onNavigateToMap={() => setActiveTab('map')}
            onNavigateTo3D={() => setActiveTab('3d')}
          />
        )}

        {activeTab === 'map' && (
          <MapView
            currentLocation={locationData}
            standard={standard}
            onSelectStation={(city) => {
              fetchLiveAqi({ city });
              setActiveTab('dashboard');
            }}
            onUseCurrentLocation={handleUseCurrentLocation}
          />
        )}

        {activeTab === '3d' && (
          <Atmospheric3DView
            currentLocation={locationData}
            standard={standard}
            onSelectCity={(city) => fetchLiveAqi({ city })}
            onUseCurrentLocation={handleUseCurrentLocation}
            isLocating={isLocating}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView currentLocation={locationData} standard={standard} />
        )}

        {activeTab === 'forecast' && (
          <ForecastView currentLocation={locationData} standard={standard} />
        )}

        {activeTab === 'comparison' && (
          <ComparisonView currentLocation={locationData} standard={standard} />
        )}

        {activeTab === 'health' && (
          <HealthView currentLocation={locationData} standard={standard} />
        )}
      </main>

      {/* Footer (hidden on 3D full-bleed viewport) */}
      {activeTab !== '3d' && <Footer />}

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Floating AI Assistant Trigger (Bottom Right Desktop) */}
      <button
        onClick={() => setIsAiOpen(true)}
        aria-label="Ask AI Assistant"
        className="fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500 text-white font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
        <span>Ask AirIQ AI</span>
      </button>

      {/* Modals */}
      <AiAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        locationData={locationData}
      />

      <SmartAlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        currentLocation={locationData}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        data={locationData}
        history={null}
      />

      <ShareCardModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        data={locationData}
      />
    </div>
  );
}
