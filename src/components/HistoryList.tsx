import React from "react";
import { Star, Trash2, Volume2, BookOpen } from "lucide-react";
import { SavedTranslation } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface HistoryListProps {
  items: SavedTranslation[];
  onSelectItem: (item: SavedTranslation) => void;
  onDeleteItem: (id: string) => void;
  onSpeak: (text: string) => void;
  activeId?: string;
}

export function HistoryList({
  items,
  onSelectItem,
  onDeleteItem,
  onSpeak,
  activeId,
}: HistoryListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm mb-3">
          <BookOpen className="w-5 h-5 text-slate-400" />
        </div>
        <h3 className="text-slate-800 font-medium text-sm">Your Mandarin Vocabulary List</h3>
        <p className="text-xs text-slate-400 max-w-[240px] mt-1 leading-normal">
          Translations you search and favorite will appear here as quick flashcards for practice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" id="saved-vocabulary-panel">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          Saved Flashcards ({items.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 max-h-[480px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const isSelected = activeId === item.id;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelectItem(item)}
                className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600/5 border-indigo-500/35 ring-1 ring-indigo-500/20"
                    : "bg-white border-slate-100 hover:border-indigo-200/50 hover:bg-indigo-50/10"
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tracking-tight text-slate-800 font-sans">
                      {item.simplified}
                    </span>
                    <span className="text-xs text-slate-400 hidden group-hover:inline">
                      {item.traditional}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-medium text-indigo-600 leading-normal mb-1">
                    {item.pinyin}
                  </div>
                  <div className="text-xs text-slate-500 font-sans font-medium line-clamp-1">
                    {item.originalText} &rarr; <span className="text-slate-700">{item.meaning}</span>
                  </div>
                </div>

                {/* Quick actions for study list */}
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSpeak(item.simplified)}
                    title="Pronounce characters"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    title="Remove from study list"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
