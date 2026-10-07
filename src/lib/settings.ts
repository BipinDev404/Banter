/**
 * App Settings & Appearance Preferences Store
 */

export type ThemeAccent = 'blue' | 'purple' | 'emerald' | 'orange' | 'pink' | 'slate' | 'gold';
export type ChatBgPattern = 'clean' | 'doodle' | 'grid' | 'dots' | 'dark-oled' | 'warm-paper' | 'gradient';
export type FontStyle = 'apple' | 'syne' | 'inter' | 'mono' | 'rounded';
export type MessageDensity = 'comfortable' | 'compact';

export interface AppSettings {
  themeAccent: ThemeAccent;
  chatBgPattern: ChatBgPattern;
  fontStyle: FontStyle;
  soundEnabled: boolean;
  messageDensity: MessageDensity;
  avatarId: string;
}

export interface ThemeOption {
  id: ThemeAccent;
  name: string;
  hex: string;
  bgClass: string;
  hoverClass: string;
  borderClass: string;
  ringClass: string;
  textClass: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'blue',
    name: 'Classic Blue',
    hex: '#007AFF',
    bgClass: 'bg-[#007AFF]',
    hoverClass: 'hover:bg-[#0071E3]',
    borderClass: 'border-[#007AFF]',
    ringClass: 'ring-[#007AFF]',
    textClass: 'text-[#007AFF]',
  },
  {
    id: 'purple',
    name: 'Electric Violet',
    hex: '#8B5CF6',
    bgClass: 'bg-[#8B5CF6]',
    hoverClass: 'hover:bg-[#7C3AED]',
    borderClass: 'border-[#8B5CF6]',
    ringClass: 'ring-[#8B5CF6]',
    textClass: 'text-[#8B5CF6]',
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    hex: '#10B981',
    bgClass: 'bg-[#10B981]',
    hoverClass: 'hover:bg-[#059669]',
    borderClass: 'border-[#10B981]',
    ringClass: 'ring-[#10B981]',
    textClass: 'text-[#10B981]',
  },
  {
    id: 'orange',
    name: 'Sunset Orange',
    hex: '#F97316',
    bgClass: 'bg-[#F97316]',
    hoverClass: 'hover:bg-[#EA580C]',
    borderClass: 'border-[#F97316]',
    ringClass: 'ring-[#F97316]',
    textClass: 'text-[#F97316]',
  },
  {
    id: 'pink',
    name: 'Neon Rose',
    hex: '#EC4899',
    bgClass: 'bg-[#EC4899]',
    hoverClass: 'hover:bg-[#DB2777]',
    borderClass: 'border-[#EC4899]',
    ringClass: 'ring-[#EC4899]',
    textClass: 'text-[#EC4899]',
  },
  {
    id: 'slate',
    name: 'Midnight Slate',
    hex: '#475569',
    bgClass: 'bg-[#475569]',
    hoverClass: 'hover:bg-[#334155]',
    borderClass: 'border-[#475569]',
    ringClass: 'ring-[#475569]',
    textClass: 'text-[#475569]',
  },
  {
    id: 'gold',
    name: 'Cyber Gold',
    hex: '#EAB308',
    bgClass: 'bg-[#EAB308]',
    hoverClass: 'hover:bg-[#CA8A04]',
    borderClass: 'border-[#EAB308]',
    ringClass: 'ring-[#EAB308]',
    textClass: 'text-[#EAB308]',
  },
];

export interface PatternOption {
  id: ChatBgPattern;
  name: string;
  description: string;
}

export const BG_PATTERN_OPTIONS: PatternOption[] = [
  { id: 'clean', name: 'Clean Solid', description: 'Pure minimalist canvas' },
  { id: 'doodle', name: 'Chat Doodles', description: 'Subtle geometric micro dots' },
  { id: 'grid', name: 'Technical Grid', description: 'Engineered blueprint grid lines' },
  { id: 'dots', name: 'Polka Dots', description: 'Playful floating polka dot array' },
  { id: 'dark-oled', name: 'OLED Black', description: 'Pitch dark zero-battery black' },
  { id: 'warm-paper', name: 'Cozy Parchment', description: 'Warm paper tint for eyes' },
  { id: 'gradient', name: 'Dusk Glow', description: 'Soft atmospheric top gradient' },
];

export interface FontOption {
  id: FontStyle;
  name: string;
  fontFamily: string;
  previewText: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'apple',
    name: 'SF Pro (Apple Standard)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    previewText: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    id: 'syne',
    name: 'Syne Modern Display',
    fontFamily: '"SF Pro Display", "Syne", -apple-system, sans-serif',
    previewText: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    id: 'inter',
    name: 'Inter Geometric Sans',
    fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
    previewText: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    id: 'mono',
    name: 'JetBrains Tech Mono',
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    previewText: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    id: 'rounded',
    name: 'Friendly Soft Rounded',
    fontFamily: 'ui-rounded, "SF Pro Rounded", "Comfortaa", system-ui, sans-serif',
    previewText: 'The quick brown fox jumps over the lazy dog.',
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  themeAccent: 'blue',
  chatBgPattern: 'dark-oled',
  fontStyle: 'apple',
  soundEnabled: true,
  messageDensity: 'comfortable',
  avatarId: 'c_fox',
};

const STORAGE_KEY = 'banter_app_settings_v2';

export function loadSavedSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function getThemeOption(accent: ThemeAccent): ThemeOption {
  return THEME_OPTIONS.find((t) => t.id === accent) || THEME_OPTIONS[0];
}

export function getFontOption(fontStyle: FontStyle): FontOption {
  return FONT_OPTIONS.find((f) => f.id === fontStyle) || FONT_OPTIONS[0];
}
