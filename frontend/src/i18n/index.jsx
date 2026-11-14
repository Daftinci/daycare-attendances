import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.json';
import ja from './ja.json';
import { formatLongEN, formatLongJA, formatShort, formatShortJA, monthLabel } from '../lib/date.js';

export const LANGS = ['en', 'ja'];
const DICTS = { en, ja };
const STORAGE_KEY = 'attendance.lang';

function fill(text, vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
}

/** Translate a key for a language. Falls back to English, then to the key itself. */
export function translate(lang, key, vars) {
  return fill(DICTS[lang]?.[key] ?? en[key] ?? key, vars);
}

function readSavedLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGS.includes(saved) ? saved : 'en';
  } catch {
    return 'en';
  }
}

function saveLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // storage blocked (private mode etc.) — the toggle still works for this visit
  }
}

function buildValue(lang, setLang) {
  return {
    lang,
    setLang,
    t: (key, vars) => translate(lang, key, vars),
    /** Long date: "Monday, 16 November 2026" or "2026年11月16日(月)" */
    longDate: (iso) => (lang === 'ja' ? formatLongJA(iso) : formatLongEN(iso)),
    /** Month name: "December 2026" or "2026年12月" */
    monthName: (ym) => monthLabel(ym)[lang],
    /** Short date: "16 Nov (Mon)" or "11月16日(月)" */
    shortDate: (iso) => (lang === 'ja' ? formatShortJA(iso) : formatShort(iso)),
  };
}

const I18nContext = createContext(buildValue('en', () => {}));

export function LanguageProvider({ children, initialLang }) {
  const [lang, setLang] = useState(() => initialLang ?? readSavedLang());
  useEffect(() => {
    saveLang(lang);
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo(() => buildValue(lang, setLang), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Translated text for a key, in the current language. */
export function T({ k, vars }) {
  const { t } = useI18n();
  return <>{t(k, vars)}</>;
}
