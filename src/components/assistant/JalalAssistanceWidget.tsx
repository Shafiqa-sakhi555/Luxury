"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { AssistantChatPanel } from "@/components/assistant/AssistantChatPanel";

export function JalalAssistanceWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close Jalal Assistance"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-midnight/40 backdrop-blur-[2px] sm:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="fixed bottom-20 right-4 z-[70] flex w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-2xl border border-glass-border bg-midnight/95 shadow-2xl shadow-midnight/50 backdrop-blur-xl sm:bottom-24 sm:right-6"
            >
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-ivory/50 transition-colors hover:bg-glass hover:text-ivory"
              >
                <X className="h-4 w-4" />
              </button>
              <AssistantChatPanel compact className="min-h-[420px]" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={open ? "Close Jalal Assistance" : "Open Jalal Assistance"}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-4 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet to-royal text-ivory shadow-lg shadow-violet/30 sm:bottom-6 sm:right-6"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </>
  );
}
