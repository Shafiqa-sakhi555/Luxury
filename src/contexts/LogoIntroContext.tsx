"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type LogoIntroPhase = "splash" | "exit" | "done";

type LogoIntroContextValue = {
  phase: LogoIntroPhase;
  skipIntro: boolean;
  showNavLogo: boolean;
  showNavLabel: boolean;
};

const LogoIntroContext = createContext<LogoIntroContextValue | null>(null);

const INTRO_SEEN_KEY = "jalals-intro-seen";

export function LogoIntroProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<LogoIntroPhase>("splash");
  const [skipIntro, setSkipIntro] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const seen = sessionStorage.getItem(INTRO_SEEN_KEY) === "1";

    if (prefersReducedMotion || seen) {
      setSkipIntro(true);
      setPhase("done");
      return;
    }

    const flyTimer = window.setTimeout(() => setPhase("exit"), 1400);
    const doneTimer = window.setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    }, 2400);

    return () => {
      window.clearTimeout(flyTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  const value = useMemo<LogoIntroContextValue>(
    () => ({
      phase,
      skipIntro,
      showNavLogo: skipIntro || phase === "exit" || phase === "done",
      showNavLabel: skipIntro || phase === "done",
    }),
    [phase, skipIntro]
  );

  return (
    <LogoIntroContext.Provider value={value}>
      {children}
    </LogoIntroContext.Provider>
  );
}

export function useLogoIntro() {
  const context = useContext(LogoIntroContext);
  if (!context) {
    throw new Error("useLogoIntro must be used within LogoIntroProvider");
  }
  return context;
}

export function useLogoIntroSafe() {
  return useContext(LogoIntroContext);
}
