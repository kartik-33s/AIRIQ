import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Plus, Trash2, X, CheckCircle, ShieldAlert } from 'lucide-react';
import { SmartAlert, LocationData } from '../types/aqi';

interface SmartAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationData | null;
}

export const SmartAlertsModal: React.FC<SmartAlertsModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
}) => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [threshold, setThreshold] = useState<number>(100);
  const [cityName, setCityName] = useState<string>('');
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('airiq_smart_alerts');
      if (stored) {
        try {
          setAlerts(JSON.parse(stored));
        } catch {
          // Ignore
        }
      }
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentLocation?.city) {
      setCityName(currentLocation.city.split(',')[0]);
    }
  }, [currentLocation]);

  if (!isOpen) return null;

  const saveAlerts = (newAlerts: SmartAlert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem('airiq_smart_alerts', JSON.stringify(newAlerts));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setStatusNotice('This browser does not support desktop notifications.');
      setTimeout(() => setStatusNotice(null), 3500);
      return;
    }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === 'granted') {
      new Notification('AirIQ Notifications Enabled', {
        body: 'You will receive real-time alerts when air pollution exceeds your chosen safety threshold.',
        icon: '/favicon.ico',
      });
      setStatusNotice('System notifications enabled successfully!');
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) return;

    const newAlert: SmartAlert = {
      id: Date.now().toString(),
      city: cityName.trim(),
      threshold: Number(threshold),
      enabled: true,
      standard: currentLocation?.standard || 'US_EPA',
    };

    saveAlerts([...alerts, newAlert]);
  };

  const handleToggle = (id: string) => {
    const updated = alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    saveAlerts(updated);
  };

  const handleDelete = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    saveAlerts(updated);
  };

  const triggerTestAlert = () => {
    if (permission === 'granted') {
      new Notification(`AirIQ High Pollution Warning!`, {
        body: `${cityName || 'Selected City'} AQI reached ${threshold} (Exceeds your safe limit). Wear an N95 mask and close windows.`,
      });
      setStatusNotice(`Notification sent: ${cityName || 'City'} AQI reached ${threshold}`);
      setTimeout(() => setStatusNotice(null), 3000);
    } else {
      setStatusNotice(`[Simulation Alert] ${cityName || 'City'} AQI reached ${threshold}. Enable browser notifications for system alerts.`);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 shadow-2xl p-4 sm:p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 light:text-slate-900 text-lg">
                Smart AQI Alerts
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-500">
                Custom threshold alerts stored locally in your browser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Alerts"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 light:hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Permission Status */}
        <div className="mt-4 p-3 rounded-xl bg-slate-800/60 light:bg-slate-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            <span className="text-slate-300 light:text-slate-700">
              Desktop Notifications: <strong className="capitalize">{permission}</strong>
            </span>
          </div>
          {permission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium text-xs transition-colors"
            >
              Enable Notifications
            </button>
          )}
        </div>

        {/* Status Notice Banner */}
        {statusNotice && (
          <div className="mt-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-400 flex items-center gap-2 animate-in fade-in">
            <BellRing className="w-4 h-4 flex-shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Add New Alert Form */}
        <form onSubmit={handleAddAlert} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 light:text-slate-600 mb-1">
                Monitored City
              </label>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="City Name"
                className="w-full bg-slate-800 light:bg-slate-50 border border-slate-700 light:border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-100 light:text-slate-900 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 light:text-slate-600 mb-1">
                AQI Threshold: {threshold}
              </label>
              <select
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full bg-slate-800 light:bg-slate-50 border border-slate-700 light:border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-100 light:text-slate-900 focus:outline-none focus:border-amber-500"
              >
                <option value={50}>50 (Above Good)</option>
                <option value={100}>100 (Above Moderate)</option>
                <option value={150}>150 (Unhealthy for Sensitive)</option>
                <option value={200}>200 (Unhealthy)</option>
                <option value={300}>300 (Hazardous / Severe)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm min-h-[40px] touch-manipulation"
            >
              <Plus className="w-4 h-4" /> Add Alert Rule
            </button>
            <button
              type="button"
              onClick={triggerTestAlert}
              className="py-2.5 px-4 rounded-lg border border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-700 hover:bg-slate-800 light:hover:bg-slate-100 text-xs font-medium min-h-[40px] touch-manipulation flex items-center justify-center"
            >
              Test Alert
            </button>
          </div>
        </form>

        {/* Saved Alert Rules List */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Active Watchlist Rules ({alerts.length})
          </h4>
          {alerts.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-3 text-center">
              No alert thresholds configured yet. Add one above to get warned when pollution spikes.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 light:bg-slate-50 border border-slate-800 light:border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert
                      className={`w-4 h-4 ${
                        a.threshold >= 200
                          ? 'text-rose-400'
                          : a.threshold >= 100
                          ? 'text-amber-400'
                          : 'text-sky-400'
                      }`}
                    />
                    <div>
                      <strong className="text-slate-200 light:text-slate-900 block">{a.city}</strong>
                      <span className="text-slate-400 light:text-slate-500">
                        Trigger when AQI exceeds {a.threshold}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(a.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        a.enabled
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {a.enabled ? 'Active' : 'Muted'}
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      aria-label="Delete rule"
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {savedSuccess && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-400 animate-in fade-in">
            <CheckCircle className="w-3.5 h-3.5" /> Rule saved to local storage!
          </div>
        )}
      </div>
    </div>
  );
};
