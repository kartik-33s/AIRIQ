import React, { useState } from 'react';
import { Bot, Mic, MicOff, X, Sparkles, History } from 'lucide-react';
import { LocationData } from '../types/aqi';
import MorphOrb, { MorphOrbPhase } from '@/components/ui/ai-thiking-orb-and-input';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationData: LocationData | null;
}

interface HistoryEntry {
  question: string;
  answer: string;
  time: string;
  model?: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  locationData,
}) => {
  const [externalPrompt, setExternalPrompt] = useState<{ id: number; text: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [phase, setPhase] = useState<MorphOrbPhase>('idle');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  if (!isOpen) return null;

  const currentCityName = locationData?.city ? locationData.city.split(',')[0].trim() : 'my area';
  const suggestedQuestions = [
    `Is it safe for outdoor running in ${currentCityName}?`,
    'What precautions should sensitive groups take right now?',
    'Explain the health difference between PM2.5 and PM10.',
    'Should I keep windows open or closed today?',
  ];

  const handleOrbSubmit = async (queryText: string): Promise<string> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          context: locationData,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const data = await resp.json();
      const replyText =
        data.reply || data.error || 'I could not process that request right now.';

      setHistory((prev) => [
        {
          question: queryText,
          answer: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: data.model,
        },
        ...prev,
      ]);

      return replyText;
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = (err as Error)?.name === 'AbortError';
      return isAbort
        ? 'The response took too long. Based on live metrics, please check the dashboard recommendations or try asking again.'
        : 'Unable to connect to the AirIQ AI Assistant server. Please check your network connection.';
    }
  };

  const triggerPrompt = (text: string) => {
    setShowHistory(false);
    setExternalPrompt({ id: Date.now(), text });
  };

  const toggleVoiceInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      recognition.start();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        setIsListening(false);
        triggerPrompt(spoken);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } catch {
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleaned = text.replace(/[*#]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-2xl h-[90dvh] sm:h-[640px] max-h-[92dvh] bg-slate-950 light:bg-white rounded-3xl border border-slate-800/90 light:border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-800/80 light:border-slate-200 bg-slate-900/70 light:bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-100 light:text-slate-900 text-sm sm:text-base truncate">
                  AirIQ AI Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-2.5 h-2.5" /> Gemini
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 light:text-slate-500 truncate">
                Live telemetry for{' '}
                <strong className="font-semibold text-slate-200 light:text-slate-800">
                  {locationData?.city || locationData?.stationName || 'Detected Location'}
                </strong>
                {locationData?.aqi !== undefined && ` • AQI ${locationData.aqi}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory((prev) => !prev)}
                aria-label="Toggle conversation history"
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 min-h-[38px] touch-manipulation transition-colors ${
                  showHistory
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                    : 'bg-slate-900 light:bg-white border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700 hover:border-slate-600'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">History</span>
                <span>({history.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleVoiceInput}
              aria-label={isListening ? 'Stop voice recognition' : 'Ask by voice'}
              title="Voice Ask"
              className={`p-2 rounded-xl border transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center touch-manipulation ${
                isListening
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-slate-900 light:bg-white border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-600 hover:text-sky-400'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Assistant"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-100 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggested Prompts Strip (1-tap launch) */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-800/60 light:border-slate-200 bg-slate-900/30 light:bg-slate-50/80 overflow-x-auto flex gap-2 no-scrollbar shrink-0">
          {suggestedQuestions.map((q, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => triggerPrompt(q)}
              disabled={phase !== 'idle' && phase !== 'answered'}
              className="text-[11px] sm:text-xs px-3 py-1.5 rounded-full bg-slate-900 light:bg-white text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-200 hover:border-sky-500/60 hover:text-sky-300 light:hover:text-sky-600 disabled:opacity-50 whitespace-nowrap transition-colors flex-shrink-0 min-h-[36px] touch-manipulation"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Main Interactive MorphOrb Stage or Recent History Drawer */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent Session Queries
                </h4>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                >
                  Back to Orb
                </button>
              </div>
              {history.map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-900/90 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-sky-400 truncate">{item.question}</span>
                    <span className="shrink-0">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-200 light:text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <MorphOrb
              onSubmit={handleOrbSubmit}
              minThinkMs={2200}
              placeholder={`Ask about ${currentCityName} air quality…`}
              answerTitle="AirIQ Intelligence"
              externalPrompt={externalPrompt}
              onSpeak={speakText}
              onPhaseChange={setPhase}
              className="flex-1"
            />
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="px-4 py-2 border-t border-slate-800/70 light:border-slate-200 bg-slate-900/50 light:bg-slate-50 shrink-0">
          <p className="text-[10px] text-slate-500 text-center">
            AirIQ AI provides atmospheric telemetry guidance. Consult medical professionals for clinical decisions.
          </p>
        </div>
      </div>
    </div>
  );
};
