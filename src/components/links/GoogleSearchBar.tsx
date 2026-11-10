import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';

export const GoogleSearchBar: React.FC = () => {
  const { theme, showToast } = useMySpace();
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // Check if input looks like a URL
    const isUrl = /^(https?:\/\/|[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$)/i.test(trimmed);
    if (isUrl) {
      const url = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(trimmed)}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Voice search is not supported in this browser.', 'warning');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Listening... Speak your search query', 'info');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setQuery(transcript);
          setIsListening(false);
          window.open(
            `https://www.google.com/search?q=${encodeURIComponent(transcript.trim())}`,
            '_blank',
            'noopener,noreferrer'
          );
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        showToast('Microphone access denied or audio not detected.', 'warning');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      showToast('Could not start voice search.', 'warning');
    }
  };

  const isDarkMode = theme === 'dark';

  return (
    <div className="w-full flex justify-center my-3 sm:my-4">
      <form
        onSubmit={handleSearch}
        role="search"
        className={`w-full sm:w-[75%] md:w-[60%] lg:w-[52%] max-w-2xl h-[48px] sm:h-[50px] rounded-full px-4 sm:px-5 flex items-center justify-between gap-3 transition-all duration-200 ${
          isDarkMode
            ? 'bg-[#202124] border border-[#5F6368] hover:bg-[#303134] hover:border-[#70757A] focus-within:bg-[#303134] focus-within:border-[#70757A] shadow-[0_1px_6px_rgba(0,0,0,0.28)]'
            : 'bg-white border border-[#DFE1E5] hover:border-[#E5A93C] focus-within:border-[#E5A93C] shadow-[0_2px_10px_rgba(245,185,66,0.12)] hover:shadow-[0_4px_16px_rgba(245,185,66,0.2)]'
        }`}
      >
        {/* Search Icon on the left */}
        <div className="shrink-0 flex items-center">
          <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#9AA0A6]" />
        </div>

        {/* Text Input in the middle */}
        <div className="flex-1 flex items-center min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Google or type a URL"
            className={`w-full bg-transparent text-sm font-normal outline-none border-none py-1 truncate ${
              isDarkMode
                ? 'text-[#E8EAED] placeholder-[#BDC1C6]'
                : 'text-gray-900 placeholder-gray-500'
            }`}
            aria-label="Search Google or type a URL"
          />
        </div>

        {/* Clear button and Microphone on the right */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Clear (X) button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className={`p-1 rounded-full transition-colors ${
                isDarkMode
                  ? 'text-[#9AA0A6] hover:text-[#E8EAED] hover:bg-white/10'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Clear"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Original Google Multicolor Microphone Icon */}
          <button
            type="button"
            onClick={handleVoiceSearch}
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              isListening
                ? 'bg-red-500/20 ring-2 ring-red-400 animate-pulse'
                : isDarkMode
                ? 'hover:bg-white/10'
                : 'hover:bg-gray-100'
            }`}
            title={isListening ? 'Listening...' : 'Search by voice'}
            aria-label="Search by voice"
          >
            <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
              />
              <path
                fill="#34A853"
                d="M11 18.92V22h2v-3.08c3.39-.49 6-3.4 6-6.92h-2c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.52 2.61 6.43 6 6.92z"
              />
              <path
                fill="#F4B400"
                d="M7 11H5c0 1.93.78 3.68 2.05 4.95l1.41-1.41C7.56 13.63 7 12.38 7 11z"
              />
              <path
                fill="#EA4335"
                d="M12 16c1.38 0 2.63-.56 3.54-1.46l-1.41-1.41c-.54.54-1.28.87-2.13.87s-1.59-.33-2.13-.87L8.46 14.54c.91.9 2.16 1.46 3.54 1.46z"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};
