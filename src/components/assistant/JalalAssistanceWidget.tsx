"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { AssistantChatPanel } from "@/components/assistant/AssistantChatPanel";
import { useAssistant } from "@/contexts/AssistantContext";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export function JalalAssistanceWidget() {
  const { isOpen, pendingPrompt, closeAssistant, toggleAssistant, consumePendingPrompt } =
    useAssistant();
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, isOpen, closeAssistant);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        closeAssistant();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeAssistant]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close Jalal Assistance"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-navy/50 backdrop-blur-[2px] sm:hidden"
              onClick={closeAssistant}
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="assistant-panel-title"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="assistant-shell fixed bottom-20 right-4 z-[70] flex h-[min(78vh,580px)] w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-2xl pb-[env(safe-area-inset-bottom)] sm:bottom-24 sm:right-6"
            >
              <button
                type="button"
                aria-label="Close chat"
                onClick={closeAssistant}
                className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <AssistantChatPanel
                compact
                titleId="assistant-panel-title"
                className="h-full min-h-0 rounded-none border-0 shadow-none"
                pendingPrompt={pendingPrompt}
                onPendingPromptConsumed={consumePendingPrompt}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={isOpen ? "Close Jalal Assistance" : "Open Jalal Assistance"}
        aria-expanded={isOpen}
        aria-controls="assistant-panel-title"
        onClick={toggleAssistant}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-4 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red to-navy text-white shadow-lg shadow-red/30 ring-2 ring-white/20 pb-[env(safe-area-inset-bottom)] sm:bottom-6 sm:right-6"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </>
  );
}
