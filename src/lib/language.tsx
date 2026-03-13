"use client";

import * as React from "react";

import { DirectionProvider } from "@/components/ui/direction";

export type Language = "en" | "ur";

type Direction = "ltr" | "rtl";

interface LanguageContextValue {
  language: Language;
  direction: Direction;
  setLanguage: (language: Language) => void;
}

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = window.localStorage.getItem("language");

  if (stored === "en" || stored === "ur") {
    return stored;
  }

  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState<Language>(() => getInitialLanguage());

  const direction: Direction = language === "ur" ? "rtl" : "ltr";

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem("language", language);

    if (typeof document !== "undefined") {
      document.documentElement.dir = direction;
    }
  }, [language, direction]);

  const value = React.useMemo(
    () => ({
      language,
      direction,
      setLanguage,
    }),
    [language, direction],
  );

  return (
    <LanguageContext.Provider value={value}>
      <DirectionProvider direction={direction}>{children}</DirectionProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}

