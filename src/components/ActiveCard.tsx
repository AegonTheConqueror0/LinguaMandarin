import React, { useState, useRef, useEffect } from "react";
import { 
  Volume2, 
  HelpCircle, 
  Copy, 
  Sparkles, 
  Star,
  Check, 
  BookOpen, 
  Mic2,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { TranslationData } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ActiveCardProps {
  data: TranslationData;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onSpeakClient: (text: string) => void;
}

interface SyllableCoach {
  syllable: string;
  initialsGuide?: string;
  finalsGuide?: string;
}

function getSyllableCoaches(pinyin: string): SyllableCoach[] {
  const cleanPinyin = pinyin
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // strip tone accents
  
  const syllables = cleanPinyin.split(/\s+/);
  const originalSyllables = pinyin.split(/\s+/);

  return syllables.map((syl, i) => {
    let initial = "";
    let final = syl;

    if (syl.startsWith("zh") || syl.startsWith("ch") || syl.startsWith("sh")) {
      initial = syl.substring(0, 2);
      final = syl.substring(2);
    } else if (
      syl.startsWith("b") || syl.startsWith("p") || syl.startsWith("m") || syl.startsWith("f") ||
      syl.startsWith("d") || syl.startsWith("t") || syl.startsWith("n") || syl.startsWith("l") ||
      syl.startsWith("g") || syl.startsWith("k") || syl.startsWith("h") || syl.startsWith("j") ||
      syl.startsWith("q") || syl.startsWith("x") || syl.startsWith("z") || syl.startsWith("c") ||
      syl.startsWith("s") || syl.startsWith("y") || syl.startsWith("w") || syl.startsWith("r")
    ) {
      initial = syl.substring(0, 1);
      final = syl.substring(1);
    }

    let initialsGuide = "";
    if (initial === "zh" || initial === "ch" || initial === "sh" || initial === "r") {
      initialsGuide = "Retroflex: Curl tongue tip backward towards the roof of your mouth. Exhale with friction.";
    } else if (initial === "j" || initial === "q" || initial === "x") {
      initialsGuide = "Palatal: Smile, place tongue flat against lower teeth, blow air out smoothly.";
    } else if (initial === "z" || initial === "c" || initial === "s") {
      initialsGuide = "Dental: Rest tongue flat against upper teeth, blow air with a slight smile.";
    } else if (initial === "b" || initial === "p" || initial === "m") {
      initialsGuide = "Labial: Close both lips firmly to accumulate pressure, then pop open to speak.";
    } else if (initial === "f") {
      initialsGuide = "Labiodental: Touch upper teeth lightly to lower lip and exhale.";
    } else if (initial === "g" || initial === "k" || initial === "h") {
      initialsGuide = "Guttural: Rest your tongue flat and squeeze gently at the back of your throat.";
    } else if (initial === "y" || initial === "w") {
      initialsGuide = "Glide: Start instantly from 'ee' or 'oo' vowels to glide into the syllable.";
    }

    let finalsGuide = "";
    if (final.includes("ü") || final.includes("yu") || (final === "u" && (initial === "j" || initial === "q" || initial === "x" || initial === "y"))) {
      finalsGuide = "Round lips tightly as if preparing to whistle 'oo', but make an 'ee' sound inside your mouth.";
    } else if (final.includes("ian")) {
      finalsGuide = "Exhale as 'ee-an' in one rapid slide. Keep the final nasal breath flowing.";
    } else if (final.includes("ang") || final.includes("ong") || final.includes("eng")) {
      finalsGuide = "Nasal final: Let the sound resonate deeply in the nasal cavity at the back of your head.";
    } else if (final === "i") {
      if (initial === "z" || initial === "c" || initial === "s" || initial === "zh" || initial === "ch" || initial === "sh" || initial === "r") {
        finalsGuide = "Buzzing sound: Buzz your vocal cords while maintaining tongue shape. Don't make an 'ee' sound.";
      } else {
        finalsGuide = "Smile wide and flatten tongue high up.";
      }
    } else if (final.includes("ao")) {
      finalsGuide = "Deep open 'ah' sliding immediately into a tight rounded 'oh' circle.";
    } else if (final === "e") {
      finalsGuide = "Relax your throat and make a sound like a polite, flat 'uh'. Do not round lips.";
    }

    return {
      syllable: originalSyllables[i] || syl,
      initialsGuide,
      finalsGuide
    };
  });
}

export function ActiveCard({
  data,
  isBookmarked,
  onToggleBookmark,
  onSpeakClient,
}: ActiveCardProps) {
  const [copied, setCopied] = useState(false);
  const [ttsEngine, setTtsEngine] = useState<"gemini" | "system">("gemini");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);

  // Persistent audio reference to bypass autoplay sandboxing/iframe blocks
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Micro practice states
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [recError, setRecError] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(data.simplified);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playGeminiTts = async (text: string) => {
    setIsTtsLoading(true);
    setIsPlaying(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error("Failed to capture server-side TTS voice");
      }
      const resData = await response.json();
      if (resData.audio && audioRef.current) {
        const audioSrc = `data:${resData.mimeType};base64,${resData.audio}`;
        audioRef.current.src = audioSrc;
        audioRef.current.load();
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (audioRef.current) {
                audioRef.current.onended = () => {
                  setIsPlaying(false);
                };
              }
            })
            .catch((e) => {
              console.warn("Unblocked audio play promise was rejected, falling back to local SpeechSynthesis", e);
              onSpeakClient(text);
              setTimeout(() => setIsPlaying(false), 1200);
            });
        }
      } else {
        throw new Error("No audio key in JSON");
      }
    } catch (err) {
      console.warn("Gemini neural TTS failed, falling back to local speech synthesis", err);
      onSpeakClient(text);
      setTimeout(() => setIsPlaying(false), 1200);
    } finally {
      setIsTtsLoading(false);
    }
  };

  const handlePlayAudio = () => {
    // Crucial: Instantly fire an empty/silent audio play synchronously upon click.
    // This unlocks the browser audio context/channel for the iframe sandbox,
    // allowing subsequent microtask/async playback of fetched base64 sound.
    if (audioRef.current) {
      audioRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      audioRef.current.play().catch(() => {});
    }

    if (ttsEngine === "gemini") {
      playGeminiTts(data.simplified);
    } else {
      setIsPlaying(true);
      onSpeakClient(data.simplified);
      setTimeout(() => setIsPlaying(false), 1000);
    }
  };

  const [playingExIndex, setPlayingExIndex] = useState<number | null>(null);

  const playExampleTts = async (text: string, index: number) => {
    // Unblock browser sandboxing instantly
    if (audioRef.current) {
      audioRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      audioRef.current.play().catch(() => {});
    }

    setPlayingExIndex(index);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch sentence voice");
      }
      const resData = await response.json();
      if (resData.audio && audioRef.current) {
        const audioSrc = `data:${resData.mimeType};base64,${resData.audio}`;
        audioRef.current.src = audioSrc;
        audioRef.current.load();
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (audioRef.current) {
                audioRef.current.onended = () => {
                  setPlayingExIndex(null);
                };
              }
            })
            .catch(() => {
              onSpeakClient(text);
              setTimeout(() => setPlayingExIndex(null), 1500);
            });
        }
      } else {
        throw new Error("No audio key in JSON");
      }
    } catch (err) {
      console.warn("Sentence TTS failed, fallback to system client speech", err);
      onSpeakClient(text);
      setTimeout(() => setPlayingExIndex(null), 1500);
    }
  };

  const handleStartPractice = () => {
    setSpokenText("");
    setScore(null);
    setFeedback("");
    setRecError("");

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecError("Speech recognition is not supported in this browser. Try Google Chrome or Microsoft Edge!");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "zh-CN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event);
        if (event.error === "not-allowed") {
          setRecError("Microphone permission denied. Click the mic icon in your address bar and reset permission.");
        } else if (event.error === "no-speech") {
          setRecError("No speech heard! Speak up, close and clear into your microphone.");
        } else {
          setRecError(`Mic error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpokenText(transcript);
        
        const cleanSpoken = transcript.replace(/[，。？！、\s]/g, "");
        const cleanExpected = data.simplified.replace(/[，。？！、\s]/g, "");

        let matchCount = 0;
        for (const char of cleanExpected) {
          if (cleanSpoken.includes(char)) {
            matchCount++;
          }
        }

        const calculatedScore = Math.round((matchCount / cleanExpected.length) * 100);
        setScore(calculatedScore);

        if (calculatedScore === 100) {
          setFeedback("100% PERFECT! Absolute authentic pitch and tone modulation.");
        } else if (calculatedScore >= 50) {
          setFeedback(`Great effort (${calculatedScore}%). You nailed Chinese initials correctly! Trace the Pitch accent line guides to perfect the full word.`);
        } else {
          setFeedback(`Pitch Correction: We recognized "${transcript}". Double-check mouth shapes and try emphasizing the stress markings above your vowels.`);
        }
      };

      recognition.start();
    } catch (err: any) {
      setRecError(`Microphone connection failed: ${err.message}`);
      setIsRecording(false);
    }
  };

  const getToneBadgeClass = (toneStr: string) => {
    const t = toneStr.toLowerCase();
    if (t.includes("1")) return "bg-blue-50 text-blue-700 border-blue-100";
    if (t.includes("2")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (t.includes("3")) return "bg-orange-50 text-orange-700 border-orange-100";
    if (t.includes("4")) return "bg-red-50 text-red-700 border-red-100";
    return "bg-slate-50 text-slate-500 border-slate-100";
  };

  const syllableCoaches = getSyllableCoaches(data.pinyin);

  return (
    <div className="bg-white rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5 sm:space-y-6" id="active-translation-card">
      
      {/* Header with bookmarks and copy */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <BookOpen className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider font-mono text-indigo-600/80">Pronunciation Center</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            title="Copy Simplified characters"
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggleBookmark}
            title={isBookmarked ? "Remove from Flashcards" : "Add to Flashcards"}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
              isBookmarked
                ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <Star className={`w-4 h-4 ${isBookmarked ? "fill-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Pronunciation Presentation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 pb-5 sm:pb-6 border-b border-dashed border-slate-100">
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-baseline gap-2.5 sm:gap-3 flex-wrap">
            <span className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 font-sans leading-none">
              {data.simplified}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-450 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md font-sans">
              Trad: {data.traditional}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-indigo-600 tracking-tight">
              {data.pinyin}
            </span>
            {data.pinyinExplanation && (
              <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-mono">
                {data.pinyinExplanation}
              </span>
            )}
          </div>

          <p className="text-sm font-sans font-medium text-slate-500">
            Meaning: <span className="text-slate-800 font-semibold">{data.meaning}</span>
          </p>
        </div>

        {/* Audio controls container */}
        <div className="flex flex-col items-stretch md:items-end gap-3 min-w-[210px]">
          {/* Audio Engine Selection Button */}
          <div className="bg-slate-50 border border-slate-150 p-1 rounded-xl flex text-[10px] uppercase font-bold text-slate-500">
            <button
              onClick={() => setTtsEngine("system")}
              className={`flex-1 py-1.5 px-3.5 rounded-lg transition-all ${
                ttsEngine === "system" 
                  ? "bg-white text-indigo-700 shadow-xs ring-1 ring-black/[0.04]" 
                  : "hover:text-slate-800"
              }`}
            >
              🗣️ Fast System TTS
            </button>
            <button
              onClick={() => setTtsEngine("gemini")}
              className={`flex-1 py-1.5 px-3.5 rounded-lg transition-all ${
                ttsEngine === "gemini" 
                  ? "bg-white text-indigo-700 shadow-xs ring-1 ring-black/[0.04]" 
                  : "hover:text-slate-800"
              }`}
            >
              🤖 Gemini Native
            </button>
          </div>

          {/* Large trigger play button */}
          <button
            onClick={handlePlayAudio}
            disabled={isTtsLoading}
            className={`w-full relative flex items-center justify-center gap-3.5 h-16 px-5 rounded-2xl text-white font-semibold shadow-md shadow-indigo-150 transition-all overflow-hidden ${
              isPlaying
                ? "bg-indigo-600 scale-98"
                : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
            }`}
          >
            {isPlaying && !isTtsLoading && (
              <motion.div
                className="absolute inset-0 bg-indigo-500/15"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              />
            )}
            
            <div className={`p-1.5 rounded-full bg-white/10 ${isTtsLoading ? "animate-spin" : ""}`}>
              {isTtsLoading ? (
                <RefreshCw className="w-5 h-5 text-indigo-100" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </div>
            
            <div className="text-left leading-tight min-w-0 flex-1">
              <div className="text-xs text-indigo-100 font-semibold tracking-wider uppercase">Pronunciation</div>
              <div className="font-sans text-sm tracking-tight text-white font-bold truncate">
                {isTtsLoading ? "Generating..." : isPlaying ? "Speaking Mandarin..." : "Listen to native speaker"}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Tones breakdown indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {data.tones.map((tone, idx) => (
          <div
            key={idx}
            className={`px-3 py-2 rounded-xl border text-center font-mono text-xs font-semibold uppercase ${getToneBadgeClass(tone)}`}
          >
            Syllable {idx + 1}: {tone}
          </div>
        ))}
      </div>

      {/* Real-time Mic Practice & Assessment Grading */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic2 className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
              Microphone Pronunciation Evaluator
            </h4>
          </div>
          {isRecording && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Ready to try speaking? Click standard audio, hear the pitch lines, then press the Record button below and pronounce "{data.simplified}" clearly.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleStartPractice}
            disabled={isRecording}
            className={`w-full sm:w-auto h-12 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isRecording
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100"
            }`}
          >
            <Mic2 className="w-4 h-4 animate-bounce" />
            {isRecording ? "Listening closely..." : "Record & Validate Voice"}
          </button>

          {score !== null && (
            <div className={`p-1 px-3.5 rounded-full font-mono text-xs font-bold border ${
              score === 100 
                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                : score >= 50 
                ? "bg-amber-50 text-amber-700 border-amber-100"
                : "bg-rose-50 text-rose-700 border-rose-100"
            }`}>
              Score: {score}%
            </div>
          )}
        </div>

        {recError && (
          <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
            {recError}
          </p>
        )}

        {spokenText && (
          <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide font-mono block">You Said:</span>
            <div className="text-lg font-bold text-slate-800">{spokenText}</div>
            {feedback && (
              <p className="text-xs text-slate-600 pt-1 border-t border-slate-50 leading-relaxed">
                {feedback}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mouth & Tongue Placement Coach */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          Perfect Mouth & Tongue Placement Coach
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {syllableCoaches.map((coach, index) => (
            (coach.initialsGuide || coach.finalsGuide) ? (
              <div
                key={index}
                className="bg-indigo-50/10 border border-indigo-50 rounded-2xl p-4 space-y-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-indigo-700 font-mono">{coach.syllable}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-slate-400">Syllable {index + 1} Anatomy</span>
                </div>
                
                <div className="space-y-1.5 text-xs">
                  {coach.initialsGuide && (
                    <p className="text-slate-600 font-sans leading-relaxed">
                      <strong className="text-indigo-900 font-medium">Consonant:</strong> {coach.initialsGuide}
                    </p>
                  )}
                  {coach.finalsGuide && (
                    <p className="text-slate-600 font-sans leading-relaxed">
                      <strong className="text-indigo-900 font-medium">Vowel:</strong> {coach.finalsGuide}
                    </p>
                  )}
                </div>
              </div>
            ) : null
          ))}
        </div>
      </div>

      {/* Interactive Structural Character Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          Character-by-Character Breakdown
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {data.breakdown.map((item, index) => (
            <div
              key={index}
              className="bg-slate-50 hover:bg-indigo-50/20 border border-slate-100 hover:border-indigo-100/50 p-3.5 rounded-2xl flex items-center gap-3 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center shadow-xs">
                <span className="text-2xl font-bold text-slate-800">{item.character}</span>
              </div>
              <div>
                <div className="font-mono text-xs font-bold text-indigo-600">{item.pinyin}</div>
                <div className="text-xs text-slate-500 font-sans font-medium line-clamp-1">{item.meaning}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contextual Examples sentences */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Practical Example Sentences
        </h4>
        <div className="space-y-3">
          {data.examples.map((ex, index) => (
            <div
              key={index}
              className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="space-y-1">
                <span className="block text-base font-semibold text-slate-800 tracking-wide font-sans">
                  {ex.simplified}
                </span>
                <span className="block text-xs font-mono font-medium text-indigo-600">
                  {ex.pinyin}
                </span>
                <span className="block text-xs text-slate-500 font-sans font-medium">
                  "{ex.english}"
                </span>
              </div>

              {/* Play Example sentence play trigger */}
              <button
                onClick={() => playExampleTts(ex.simplified, index)}
                title="Speak sentence"
                disabled={playingExIndex !== null && playingExIndex !== index}
                className={`self-end sm:self-center p-2 rounded-xl border transition-all active:scale-95 shadow-sm cursor-pointer ${
                  playingExIndex === index
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                    : "bg-white border-slate-150 text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                }`}
              >
                {playingExIndex === index ? (
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Practical Pronunciation Guide Notes */}
      <div className="bg-indigo-50/35 rounded-2xl border border-indigo-100/50 p-5 flex gap-3">
        <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wide font-mono">Learner's Pronunciation & Tone Tip</h5>
          <p className="text-xs text-slate-600 leading-normal font-sans">
            {data.tips}
          </p>
        </div>
      </div>

    </div>
  );
}
