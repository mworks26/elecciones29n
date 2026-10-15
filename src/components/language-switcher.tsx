import { useEffect, useState } from "react";
import { Languages } from "lucide-react";

/** Automatic page translation (free Google widget). Spanish is the original. */
export const LANGUAGES = [
  { code: "es", label: "Español" },
  { code: "ca", label: "Català / Valencià" },
  { code: "eu", label: "Euskara" },
  { code: "gl", label: "Galego" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
] as const;

const NOTICE: Record<string, string> = {
  ca: "Traducció automàtica. El text oficial és l'original en castellà; consulta sempre la font.",
  eu: "Itzulpen automatikoa. Testu ofiziala gaztelaniazko jatorrizkoa da; begiratu beti iturria.",
  gl: "Tradución automática. O texto oficial é o orixinal en castelán; consulta sempre a fonte.",
  en: "Automatic translation. The official text is the Spanish original; always check the source.",
  fr: "Traduction automatique. Le texte officiel est l'original en espagnol ; vérifiez toujours la source.",
  de: "Automatische Übersetzung. Maßgeblich ist das spanische Original; prüfen Sie immer die Quelle.",
  it: "Traduzione automatica. Il testo ufficiale è l'originale in spagnolo; verifica sempre la fonte.",
};

function readLang(): string {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/);
  return m?.[1] ?? "es";
}

function writeLang(code: string) {
  const host = window.location.hostname;
  const expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  for (const d of ["", `;domain=${host}`, `;domain=.${host}`]) document.cookie = `googtrans=;path=/${d};${expire}`;
  if (code !== "es") {
    document.cookie = `googtrans=/es/${code};path=/`;
    document.cookie = `googtrans=/es/${code};path=/;domain=${host}`;
  }
  window.location.reload();
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: { translate?: { TranslateElement: new (opts: object, id: string) => unknown } };
  }
}

export function LanguageSwitcher() {
  const [lang, setLang] = useState("es");

  useEffect(() => {
    const current = readLang();
    setLang(current);
    if (current === "es" || document.getElementById("gt-script")) return;
    window.googleTranslateElementInit = () => {
      if (window.google?.translate) {
        new window.google.translate.TranslateElement({ pageLanguage: "es", autoDisplay: false }, "google_translate_element");
      }
    };
    const s = document.createElement("script");
    s.id = "gt-script";
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(s);
  }, []);

  return (
    <label className="notranslate inline-flex items-center gap-1.5 rounded-full border border-input bg-card px-2.5 py-1 text-sm" translate="no">
      <Languages className="size-4 text-muted-foreground" aria-hidden />
      <span className="sr-only">Idioma / Language</span>
      <select value={lang} onChange={(e) => writeLang(e.target.value)} className="cursor-pointer bg-transparent font-medium outline-none">
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
      <div id="google_translate_element" className="hidden" />
    </label>
  );
}

export function TranslationNotice() {
  const [lang, setLang] = useState("es");
  useEffect(() => setLang(readLang()), []);
  if (lang === "es" || !NOTICE[lang]) return null;
  return (
    <p translate="no" className="notranslate border-b border-border bg-highlight px-4 py-1 text-center text-xs text-highlight-foreground">
      {NOTICE[lang]}
    </p>
  );
}
