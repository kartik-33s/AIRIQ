import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Mic, MicOff, Volume2, X, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { LocationData } from '../types/aqi';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationData: LocationData | null;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  time: string;
  source?: 'gemini' | 'airiq-engine';
  model?: string;
  note?: string;
}

const renderInlineStyles = (str: string) => {
  const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-100 light:text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="text-slate-400 light:text-slate-500 text-xs italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

const renderFormattedText = (content: string) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 text-xs sm:text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-sky-300 light:text-sky-700 text-sm mt-2 mb-0.5">
              {renderInlineStyles(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-extrabold text-sky-200 light:text-sky-800 text-base mt-2 mb-0.5">
              {renderInlineStyles(trimmed.slice(3))}
            </h3>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 text-slate-200 light:text-slate-800">
              <span className="text-sky-400 mt-1 text-xs">•</span>
              <span className="flex-1 leading-relaxed">{renderInlineStyles(trimmed.slice(2))}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {renderInlineStyles(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  locationData,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello! I am your AirIQ Environmental Intelligence Assistant. I am analyzing the live air quality data for ${locationData?.city || 'your area'}. How can I assist you with health advice, pollution mitigation, or activity planning?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentCityName = locationData?.city ? locationData.city.split(',')[0].trim() : 'my area';
  const suggestedQuestions = [
    `Is it safe for outdoor running in ${currentCityName}?`,
    'What precautions should sensitive groups take right now?',
    'Explain the health difference between PM2.5 and PM10.',
    'Should I keep windows open or closed today?',
  ];

  useEffect(() => {
    if (locationData && messages.length === 1 && messages[0].role === 'assistant') {
      const displayLocation = locationData.city || locationData.stationName || 'your area';
      setMessages([
        {
          role: 'assistant',
          text: `Hello! I am your AirIQ Environmental Intelligence Assistant. I am analyzing the live air quality data for **${displayLocation}** (AQI: ${locationData.aqi}, ${locationData.standard}). How can I assist you with health advice, pollution mitigation, or activity planning?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [locationData?.city, locationData?.stationName, locationData?.aqi]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000); // 10s client timeout max

    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context: locationData,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const data = await resp.json();
      const replyText = data.reply || data.error || 'I could not process that request.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: data.source,
          model: data.model,
          note: data.note,
        },
      ]);
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = (err as Error)?.name === 'AbortError';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: isAbort
            ? 'The response took too long. Based on live metrics, please check the dashboard recommendations or try asking again.'
            : 'Unable to connect to the AirIQ AI Assistant server. Please check your network connection.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Web Speech API Voice Input
  const toggleVoiceInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

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
        setInput(spoken);
        setIsListening(false);
        handleSend(spoken);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } catch {
      setIsListening(false);
    }
  };

  // Text to Speech
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Strip markdown asterisks and hashtags for clean speech
      const cleaned = text.replace(/[*#]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl h-[620px] max-h-[90vh] bg-slate-900 light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 light:border-slate-200 bg-slate-950/50 light:bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 light:text-slate-900 text-base">
                  AirIQ AI Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Gemini
                </span>
              </div>
              <p className="text-xs text-slate-400 light:text-slate-500">
                Contextual environmental intelligence for <strong className="font-semibold text-slate-200 light:text-slate-800">{locationData?.city || locationData?.stationName || 'Detected Location'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Assistant"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-sky-600 text-white rounded-br-none'
                    : 'bg-slate-800/90 light:bg-slate-100 text-slate-200 light:text-slate-800 rounded-bl-none border border-slate-700/50 light:border-slate-200'
                }`}
              >
                {m.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{m.text}</div>
                ) : (
                  renderFormattedText(m.text)
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 px-1 flex-wrap">
                <span className="text-[10px] text-slate-500">{m.time}</span>
                {m.model && (
                  <span className="text-[10px] text-sky-400/80 font-mono">
                    via {m.model}
                  </span>
                )}
                {m.source === 'airiq-engine' && (
                  <span className="text-[10px] text-emerald-400/80 font-medium">
                    AirIQ Intelligence Engine
                  </span>
                )}
                {m.role === 'assistant' && (
                  <button
                    onClick={() => speakText(m.text)}
                    aria-label="Read answer aloud"
                    className="text-slate-400 hover:text-sky-400 text-[11px] flex items-center gap-0.5 ml-1"
                  >
                    <Volume2 className="w-3 h-3" /> Listen
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-3 bg-slate-800/50 rounded-lg w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span>Analyzing air quality metrics with Gemini...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 border-t border-slate-800/60 light:border-slate-200 bg-slate-950/20 light:bg-slate-50 overflow-x-auto flex gap-2 no-scrollbar">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800 light:bg-white text-slate-300 light:text-slate-700 border border-slate-700/60 light:border-slate-200 hover:border-sky-500 whitespace-nowrap transition-colors flex-shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 light:border-slate-200 bg-slate-950/50 light:bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              aria-label={isListening ? 'Stop voice recognition' : 'Start voice recognition'}
              className={`p-2.5 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-slate-800 light:bg-slate-100 border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-600 hover:text-white'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask anything about air quality in ${locationData?.city?.split(',')[0] || 'your city'}...`}
              className="flex-1 bg-slate-800/80 light:bg-slate-100 border border-slate-700 light:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-100 light:text-slate-900 focus:outline-none focus:border-sky-500 transition-colors"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send query"
              className="p-2.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <p className="text-[10px] text-slate-500 mt-2 text-center">
            AirIQ AI provides atmospheric data guidance. Consult medical professionals for clinical healthcare decisions.
          </p>
        </div>
      </div>
    </div>
  );
};
