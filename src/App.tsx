import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Search, 
  BookOpen, 
  Loader2, 
  Languages, 
  BookMarked,
  Info,
  HelpCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TranslationData, SavedTranslation } from "./types";
import { ActiveCard } from "./components/ActiveCard";
import { ToneGuide } from "./components/ToneGuide";
import { HistoryList } from "./components/HistoryList";

const QUICK_START_CATEGORIES = [
  { label: "Greetings", items: ["Hello", "Good morning", "Thank you", "Goodbye"] },
  { label: "Survival", items: ["Where is the restroom?", "I don't understand", "How much is this?", "Help"] },
  { label: "Food & Drinks", items: ["Water", "Delicious", "Tea", "Rice", "Restaurant"] },
  { label: "People & Social", items: ["I love you", "My name is...", "Friend", "Teacher"] }
];

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<TranslationData | null>(null);
  const [savedItems, setSavedItems] = useState<SavedTranslation[]>([]);

  // Master audio reference to play high-fidelity, server-side phonetic speech
  const masterAudioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    masterAudioRef.current = new Audio();
    return () => {
      if (masterAudioRef.current) {
        masterAudioRef.current.pause();
        masterAudioRef.current.src = "";
      }
    };
  }, []);

  // Load saved cards from localstorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mandarin_pronounce_favorites");
      if (stored) {
        setSavedItems(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Could not read vocabulary from local storage", err);
    }
  }, []);

  // Pre-warm local browser SpeechSynthesis engine voices immediately on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Cycle loading messages for a highly responsive learning feel
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 1000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const saveFavorites = (newItems: SavedTranslation[]) => {
    setSavedItems(newItems);
    try {
      localStorage.setItem("mandarin_pronounce_favorites", JSON.stringify(newItems));
    } catch (err) {
      console.warn("Failed to write to local storage", err);
    }
  };

  const speakSyllableClient = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8; // slightly slower for better acoustic dissection
      
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(
        (v) =>
          v.lang.includes("zh-CN") ||
          v.lang.includes("zh") ||
          v.lang.includes("ZH")
      );
      if (zhVoice) {
        utterance.voice = zhVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const playServerTts = async (text: string) => {
    if (!text || !text.trim()) return;

    // Instantly unlock browser audio stream (crucial inside sandboxed iframe context)
    if (masterAudioRef.current) {
      masterAudioRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      masterAudioRef.current.play().catch(() => {});
    }

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!response.ok) {
        throw new Error("Failed to secure TTS speech stream from server");
      }
      const resData = await response.json();
      if (resData.audio && masterAudioRef.current) {
        const audioSrc = `data:${resData.mimeType};base64,${resData.audio}`;
        masterAudioRef.current.src = audioSrc;
        masterAudioRef.current.load();
        
        const playPromise = masterAudioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } else {
        throw new Error("No audio key returned");
      }
    } catch (err) {
      console.warn("Server-side TTS failed, falling back to local speech synthesis", err);
      speakSyllableClient(text);
    }
  };

  const handleTranslate = async (textToTranslate: string) => {
    if (!textToTranslate || !textToTranslate.trim()) return;
    
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToTranslate.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to secure accurate translation. Check your network.");
      }

      const data: TranslationData = await response.json();
      setActiveItem(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected translation error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTranslate(query);
  };

  const handleToggleBookmark = () => {
    if (!activeItem) return;
    
    const existingIndex = savedItems.findIndex(
      (item) => item.simplified === activeItem.simplified
    );

    if (existingIndex > -1) {
      // Remove
      const updated = savedItems.filter((_, i) => i !== existingIndex);
      saveFavorites(updated);
    } else {
      // Add
      const currentItem: SavedTranslation = {
        ...activeItem,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      saveFavorites([currentItem, ...savedItems]);
    }
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedItems.filter((item) => item.id !== id);
    saveFavorites(updated);
  };

  const isCurrentBookmarked = activeItem
    ? savedItems.some((item) => item.simplified === activeItem.simplified)
    : false;

  const selectHistoryItem = (item: SavedTranslation) => {
    setActiveItem(item);
    setQuery(item.originalText);
  };

  const loadingMessages = [
    "Analyzing linguistics...",
    "Extracting Mandarin tone values...",
    "Breaking down character meanings...",
    "Synthesizing high-fidelity audio waves..."
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900" id="mandarin-pronounce-app">
      {/* Navbar Banner matching Sleek Interface theme with responsive paddings */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100/80 backdrop-blur-md" id="top-navigation-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl select-none">
              L
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">LinguaMandarin</h1>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <a 
              href="#saved-vocabulary-panel" 
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Vocabulary
            </a>
            <a 
              href="#tone-guide-panel" 
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 sm:gap-1.5"
            >
              <span>Daily Quiz</span>
              {savedItems.length > 0 && (
                <span className="bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px]">
                  {savedItems.length}
                </span>
              )}
            </a>
          </div>
        </div>
      </nav>

      {/* Main Container with responsive columns and gutters */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Left Column: Input, Quick Start, Active Translation Details (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/30 p-5 sm:p-8 space-y-5 sm:space-y-6">
            <div className="space-y-1 text-center mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                What would you like to say?
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm">
                Type in English to get instant Mandarin translation and audio.
              </p>
            </div>

            {/* Responsive Translation Input Form - graceful stacking on mobile, side-by-side flexbox on tablet & PC to prevent overlaps */}
            <form onSubmit={handleSubmit} className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Type English e.g., Adventure, Welcome, Peace..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 h-14 sm:h-16 px-5 sm:px-6 text-base sm:text-lg font-medium bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-slate-300 transition-all text-slate-800"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="h-14 sm:h-16 px-6 sm:px-8 bg-indigo-600 text-white rounded-2xl font-semibold shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-97 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Languages className="w-4 h-4" />
                  )}
                  <span>Translate</span>
                </button>
              </div>
            </form>

            {/* Quick Touch Suggestions Categorized */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tap Quick-Start Syllables</span>
              </div>
              <div className="space-y-2.5 sm:space-y-3.5">
                {QUICK_START_CATEGORIES.map((cat, catIdx) => (
                  <div key={catIdx} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-450 uppercase font-mono mr-0.5 sm:mr-1">
                      {cat.label}:
                    </span>
                    {cat.items.map((item, itemIdx) => (
                      <button
                        key={itemIdx}
                        type="button"
                        onClick={() => {
                          setQuery(item);
                          handleTranslate(item);
                        }}
                        className="text-[11px] sm:text-xs bg-slate-50 hover:bg-indigo-50/50 hover:text-indigo-800 border border-slate-120 hover:border-indigo-200/60 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 transition-all text-slate-600 font-medium active:scale-95 cursor-pointer shadow-xs"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Translation Panel OR Placeholder states */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading-container"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 p-6 sm:p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[360px]"
                >
                  <div className="relative">
                    {/* Concentric loading rings matching Sleek Indigo theme */}
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-600/30"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm relative z-10">
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-base text-slate-800">Cultivating Translations...</h3>
                    <p className="text-xs text-indigo-700/80 font-mono font-bold tracking-wider uppercase h-4">
                      {loadingMessages[loadingStep]}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-[280px] leading-normal font-sans">
                    We query our Gemini model to secure authentic local pronunciation rules and character tone dynamics.
                  </p>
                </motion.div>
              ) : errorMsg ? (
                <motion.div
                  key="error-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-rose-50/50 border border-rose-100 rounded-[24px] sm:rounded-[32px] p-6 text-center space-y-4"
                >
                  <p className="text-sm font-semibold text-rose-800">{errorMsg}</p>
                  <button
                    onClick={() => handleTranslate(query)}
                    className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold px-4 py-2 rounded-xl transition-all"
                  >
                    Retry Query
                  </button>
                </motion.div>
              ) : activeItem ? (
                <motion.div
                  key="translation-card-container"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <ActiveCard
                    data={activeItem}
                    isBookmarked={isCurrentBookmarked}
                    onToggleBookmark={handleToggleBookmark}
                    onSpeakClient={speakSyllableClient}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty-placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-slate-100 rounded-[24px] sm:rounded-[32px] p-5 sm:p-12 text-center flex flex-col items-center justify-center min-h-[360px] shadow-sm shadow-slate-200/20"
                >
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/60 shadow-sm mb-4">
                    <Languages className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">Speak Mandarin Accurate & Natural</h3>
                  <p className="text-slate-400 text-xs sm:text-sm max-w-[320px] mt-2 leading-relaxed">
                    Type an English word above or select one from our helpful lists to dissect its tones, syllables, and start speaking.
                  </p>

                  <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-lg w-full text-left">
                    <div className="bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex gap-3">
                      <div className="text-sm font-mono font-bold text-indigo-600">1</div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-700">Detailed Pinyin & Tones</h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-405 leading-normal">See syllable tones classified dynamically to target pitch correctness.</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex gap-3">
                      <div className="text-sm font-mono font-bold text-indigo-600">2</div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-700">Dual Audio Pronounce</h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-405 leading-normal">Choose between dual high-fidelity native audio synthesizer or fast system audio.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Tone Masterclass (ToneGuide) and Saved Flashcards list (4 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tone masterclass */}
          <ToneGuide onSpeak={playServerTts} />

          {/* Saved bookmarks list */}
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/30 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-indigo-50">
              <BookMarked className="w-4 h-4 text-indigo-600" />
              <h2 className="font-bold text-slate-800 text-sm">Personal Study Folder</h2>
            </div>
            <HistoryList
              items={savedItems}
              onSelectItem={selectHistoryItem}
              onDeleteItem={handleDeleteSaved}
              onSpeak={playServerTts}
              activeId={activeItem ? savedItems.find(i => i.simplified === activeItem.simplified)?.id : undefined}
            />
          </div>
        </div>

      </main>

      {/* Aesthetic Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 text-center text-xs text-slate-400 border-t border-slate-100 pt-8">
        <p className="font-medium">Mandarin Pronounce Pocket Trainer • Created with accurate Gemini Linguistics</p>
        <p className="mt-1">Pinyin is systemically parsed. Practicing pitch curves consistently creates authentic Mandarin fluency.</p>
      </footer>
    </div>
  );
}
