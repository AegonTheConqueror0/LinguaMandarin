import React, { useState } from "react";
import { Volume2, Info, ArrowUpRight, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ToneItem {
  number: number;
  name: string;
  chineseName: string;
  symbol: string;
  ipa: string;
  pitchRange: string;
  desc: string;
  humanAnalogy: string;
  exampleWord: string;
  exampleChar: string;
  pinyin: string;
  svgPath: string; // Pitch contour for drawing
}

const TONES_DATA: ToneItem[] = [
  {
    number: 1,
    name: "First Tone",
    chineseName: "阴平 (Yīnpíng)",
    symbol: "ā (High-Flat)",
    ipa: "55",
    pitchRange: "High, level pitch",
    desc: "Keep your voice high, constant, and flat. Like singing a long note in a choir or saying 'ahhh' at the doctor's.",
    humanAnalogy: "Like singing a high, continuous 'laaaa'",
    exampleWord: "Mother",
    exampleChar: "妈",
    pinyin: "mā",
    svgPath: "M20,40 L180,40",
  },
  {
    number: 2,
    name: "Second Tone",
    chineseName: "阳平 (Yángpíng)",
    symbol: "á (Rising)",
    ipa: "35",
    pitchRange: "Mid to high rising pitch",
    desc: "Start mid-range and rise rapidly to top pitch. It sounds surprised or inquisitive, resembling a question.",
    humanAnalogy: "Like asking 'What?' or 'Really?'",
    exampleWord: "Hemp / To Numb",
    exampleChar: "麻",
    pinyin: "má",
    svgPath: "M20,120 Q100,105 180,40",
  },
  {
    number: 3,
    name: "Third Tone",
    chineseName: "上声 (Shǎngshēng)",
    symbol: "ǎ (Dipping)",
    ipa: "214",
    pitchRange: "Low dipping to high",
    desc: "Drop your voice to the lowest possible register, then curve it back upward. A classic dipping sensation.",
    humanAnalogy: "Like saying a slow, doubtful 'Well...'",
    exampleWord: "Horse",
    exampleChar: "马",
    pinyin: "mǎ",
    svgPath: "M20,100 Q100,170 180,80",
  },
  {
    number: 4,
    name: "Fourth Tone",
    chineseName: "去声 (Qùshēng)",
    symbol: "à (Falling)",
    ipa: "51",
    pitchRange: "High falling to low",
    desc: "Start high and drop sharply to absolute low. Fast, sudden, and assertive. Like typing a forceful punctuation mark.",
    humanAnalogy: "Like shouting a firm, direct shout of 'No!'",
    exampleWord: "To Scold",
    exampleChar: "骂",
    pinyin: "mà",
    svgPath: "M20,40 L180,150",
  },
  {
    number: 5,
    name: "Neutral Tone",
    chineseName: "轻声 (Qīngshēng)",
    symbol: "a (Neutral)",
    ipa: "variable",
    pitchRange: "Light, short sound",
    desc: "A quick, soft, flat syllable without any pitch emphasis. Played briefly like a light tapping pattern.",
    humanAnalogy: "Like a light tap of a pencil on a desk",
    exampleWord: "Question Particle",
    exampleChar: "吗",
    pinyin: "ma",
    svgPath: "M100,100 A10,10 0 1,1 100.1,100",
  },
];

interface ToneGuideProps {
  onSpeak?: (text: string) => void | Promise<void>;
}

export function ToneGuide({ onSpeak }: ToneGuideProps) {
  const [activeToneIndex, setActiveToneIndex] = useState<number>(0);
  const activeTone = TONES_DATA[activeToneIndex];

  const handleSpeak = async (text: string) => {
    if (onSpeak) {
      try {
        await onSpeak(text);
        return;
      } catch (err) {
        console.warn("Central onSpeak audio failed, backing up to local SpeechSynthesis:", err);
      }
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8; // Speak slightly slower to focus on tone
      
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

  return (
    <div className="bg-slate-50/80 rounded-[28px] border border-slate-120 p-6 shadow-sm shadow-slate-100" id="tone-guide-panel">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
          <Volume2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800">Mandarin Tones Masterclass</h2>
          <p className="text-xs text-slate-500">Mandarin is tonal: the same syllable with different pitches means entirely different things.</p>
        </div>
      </div>

      {/* Grid selector */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {TONES_DATA.map((tone, idx) => (
          <button
            key={tone.number}
            onClick={() => setActiveToneIndex(idx)}
            className={`py-3 px-2 rounded-xl text-center transition-all cursor-pointer ${
              activeToneIndex === idx
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-150 scale-102 font-semibold"
                : "bg-white hover:bg-indigo-50/50 text-slate-700 border border-slate-100"
            }`}
          >
            <div className={`text-xl font-extrabold ${activeToneIndex === idx ? "text-indigo-100" : "text-indigo-600"}`}>
              {tone.number}
            </div>
            <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-ellipsis px-1 font-medium select-none">
              {tone.pinyin}
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeToneIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_rgba(241,245,249,0.5)]"
        >
          {/* Tone detail details */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-indigo-600 tracking-wider uppercase">
                  {activeTone.name}
                </span>
                <span className="text-xs text-slate-400 font-medium">| {activeTone.chineseName}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {activeTone.symbol}
              </h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                {activeTone.desc}
              </p>

              <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="font-semibold text-indigo-700 mt-0.5">Pitch:</span>
                  <span>{activeTone.pitchRange} (acoustic index: {activeTone.ipa})</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="font-semibold text-indigo-700 mt-0.5">Mental Cue:</span>
                  <span>{activeTone.humanAnalogy}</span>
                </div>
              </div>
            </div>

            {/* Syllable practice audio button */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handleSpeak(activeTone.exampleChar)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-100/80 transition-all active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Hear "{activeTone.pinyin}" ({activeTone.exampleChar})</span>
              </button>

              <div className="text-xs text-slate-400">
                Meaning: <span className="text-indigo-650 font-bold">{activeTone.exampleWord}</span>
              </div>
            </div>
          </div>

          {/* SVG Pitch contour representation */}
          <div className="md:col-span-5 h-[170px] bg-slate-50/50 rounded-xl flex flex-col justify-between p-3.5 border border-slate-100 relative overflow-hidden">
            <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider font-bold text-indigo-600/60 font-mono">
              Pitch Profile
            </span>
            
            {/* The 1-5 pitch scale labels */}
            <div className="flex flex-1 justify-between items-stretch">
              <div className="flex flex-col justify-between text-[10px] font-mono text-slate-400/80 w-6">
                <span>5 (High)</span>
                <span>4</span>
                <span>3</span>
                <span>2</span>
                <span>1 (Low)</span>
              </div>

              {/* Pitch contour canvas */}
              <div className="flex-1 ml-4 relative border-l border-b border-dashed border-slate-200">
                <svg className="w-full h-full" viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
                  {/* Subtle horizontal grid guide lines */}
                  <line x1="0" y1="40" x2="200" y2="40" stroke="#f1f5f9" strokeDasharray="3,3" />
                  <line x1="0" y1="75" x2="200" y2="75" stroke="#f1f5f9" strokeDasharray="3,3" />
                  <line x1="0" y1="110" x2="200" y2="110" stroke="#f1f5f9" strokeDasharray="3,3" />
                  <line x1="0" y1="145" x2="200" y2="145" stroke="#f1f5f9" strokeDasharray="3,3" />

                  {/* Draw Pitch line */}
                  {activeTone.number !== 5 ? (
                    <motion.path
                      key={activeTone.number}
                      d={activeTone.svgPath}
                      fill="transparent"
                      stroke="#4f46e5"
                      strokeWidth="5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  ) : (
                    // Draw a short neutral dot
                    <motion.circle
                      cx="100"
                      cy="110"
                      r="8"
                      fill="#4f46e5"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    />
                  )}
                </svg>
              </div>
            </div>

            <div className="text-[10px] font-mono text-center text-slate-400 w-full pt-1 uppercase tracking-wider">
              Time / Syllable Duration
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
