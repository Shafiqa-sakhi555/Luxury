"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type OpenAssistantOptions = {
  prompt?: string;
};

type AssistantContextValue = {
  isOpen: boolean;
  pendingPrompt: string | null;
  openAssistant: (options?: OpenAssistantOptions) => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  consumePendingPrompt: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const openAssistant = useCallback((options?: OpenAssistantOptions) => {
    if (options?.prompt) {
      setPendingPrompt(options.prompt);
    }
    setIsOpen(true);
  }, []);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleAssistant = useCallback(() => {
    setIsOpen((open) => !open);
  }, []);

  const consumePendingPrompt = useCallback(() => {
    setPendingPrompt(null);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      pendingPrompt,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      consumePendingPrompt,
    }),
    [isOpen, pendingPrompt, openAssistant, closeAssistant, toggleAssistant, consumePendingPrompt]
  );

  return (
    <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return context;
}

export function useAssistantSafe() {
  return useContext(AssistantContext);
}
