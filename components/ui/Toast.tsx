"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

// ── Context ───────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const variantStyles: Record<ToastVariant, string> = {
    success: "bg-[#424242] text-white border-l-4 border-[#ffc000]",
    error:   "bg-white text-[#424242] border-l-4 border-red-500 shadow-[0_4px_20px_rgba(0,0,0,0.12)]",
    info:    "bg-white text-[#424242] border-l-4 border-[#ffc000] shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
  };

  const icons: Record<ToastVariant, string> = {
    success: "✓",
    error:   "✕",
    info:    "ℹ",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container — fixed bottom-right */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 min-w-[260px] max-w-sm px-4 py-3 rounded-xl
              shadow-[0_4px_24px_rgba(0,0,0,0.15)] pointer-events-auto
              animate-slide-up text-[13px] font-semibold
              ${variantStyles[toast.variant]}
            `}
          >
            <span className="text-base leading-none flex-shrink-0 font-black">
              {icons[toast.variant]}
            </span>
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity text-[16px] leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
