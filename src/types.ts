export interface BreakdownItem {
  character: string;
  pinyin: string;
  meaning: string;
}

export interface ExampleItem {
  simplified: string;
  pinyin: string;
  english: string;
}

export interface TranslationData {
  originalText: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  pinyinExplanation?: string;
  meaning: string;
  breakdown: BreakdownItem[];
  tones: string[];
  examples: ExampleItem[];
  tips: string;
}

export interface SavedTranslation extends TranslationData {
  id: string;
  timestamp: number;
}
