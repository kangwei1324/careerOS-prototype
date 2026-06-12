import { useEffect, useState } from "react";
import { type EntryMedia } from "@/lib/types";

export function Lightbox({
  media,
  startIndex,
  onClose,
}: {
  media: EntryMedia[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, media.length - 1));
      if (e.key === "ArrowLeft")  setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [media.length, onClose]);

  const current = media[idx];
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox"
    >
      <div
        className="relative max-w-4xl w-full flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.caption || "Fullscreen image"}
          className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
        />
        {current.caption && (
          <p className="text-white/70 text-[13px] text-center" aria-live="polite">{current.caption}</p>
        )}
        {media.length > 1 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIdx((i) => Math.max(i - 1, 0))}
              disabled={idx === 0}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white disabled:opacity-30 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#ffc000]"
              aria-label="Previous Image"
            >
              ‹
            </button>
            <span className="text-white/50 text-[12px]" aria-live="polite">
              {idx + 1} / {media.length}
            </span>
            <button
              onClick={() => setIdx((i) => Math.min(i + 1, media.length - 1))}
              disabled={idx === media.length - 1}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white disabled:opacity-30 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#ffc000]"
              aria-label="Next Image"
            >
              ›
            </button>
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white text-[18px] flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#ffc000]"
          aria-label="Close Lightbox"
        >
          ×
        </button>
      </div>
    </div>
  );
}
