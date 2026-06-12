"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { EntryMedia, EntryLink } from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────────────────────

export function ensureHttp(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

// ── MediaEditor ───────────────────────────────────────────────────────────────

export function MediaEditor({
  media,
  onChange,
}: {
  media: EntryMedia[];
  onChange: (m: EntryMedia[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const results: EntryMedia[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/portfolio/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        results.push({ url: data.url, caption: "" });
      } catch (err: any) {
        showToast(err.message || "Upload failed", "error");
      }
    }
    setUploading(false);
    if (results.length) onChange([...media, ...results]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const remove = (idx: number) => {
    const next = [...media];
    next.splice(idx, 1);
    onChange(next);
  };

  const setCaption = (idx: number, caption: string) => {
    onChange(media.map((m, i) => (i === idx ? { ...m, caption } : m)));
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#424242]/50">
        Proof Images
      </p>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-[#424242]/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#ffc000]/60 hover:bg-[#ffc000]/5 transition-all min-h-[80px]"
      >
        {uploading ? (
          <span className="flex items-center gap-2 text-[12px] text-[#424242]/50">
            <span className="w-4 h-4 border-2 border-[#424242]/20 border-t-[#ffc000] rounded-full animate-spin" />
            Uploading…
          </span>
        ) : (
          <>
            <span className="text-2xl" aria-hidden="true">🖼️</span>
            <span className="text-[12px] text-[#424242]/50">
              Drop images here, or{" "}
              <span className="text-[#b38600] font-bold">click to browse</span>
            </span>
            <span className="text-[10px] text-[#424242]/30">
              jpg · png · gif · webp — max 5 MB each
            </span>
          </>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {media.map((m, i) => (
            <div
              key={i}
              className="relative group rounded-xl overflow-hidden border border-[#424242]/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.caption || "uploaded"}
                className="w-full h-28 object-cover"
              />
              <button
                onClick={() => remove(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-[11px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                ✕
              </button>
              <input
                value={m.caption}
                onChange={(e) => setCaption(i, e.target.value)}
                placeholder="Caption (optional)"
                className="w-full px-2 py-1.5 text-[11px] text-[#424242] border-t border-[#424242]/10 outline-none focus:bg-[#ffc000]/5 bg-white"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── LinksEditor ───────────────────────────────────────────────────────────────

export function LinksEditor({
  links,
  onChange,
}: {
  links: EntryLink[];
  onChange: (l: EntryLink[]) => void;
}) {
  const [urlInput, setUrlInput] = useState("");
  const [labelInput, setLabelInput] = useState("");

  const add = () => {
    const url = urlInput.trim();
    if (!url) return;
    onChange([...links, { url: ensureHttp(url), label: labelInput.trim() || url }]);
    setUrlInput("");
    setLabelInput("");
  };

  const remove = (idx: number) => {
    const next = [...links];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#424242]/50">
        Proof Links
      </p>

      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((l, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-[#f7f7f7] border border-[#424242]/10 rounded-lg px-3 py-2"
            >
              <span className="text-[13px]" aria-hidden="true">🔗</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-[#424242] truncate">{l.label}</p>
                <p className="text-[10px] text-[#424242]/40 truncate">{l.url}</p>
              </div>
              <button
                onClick={() => remove(i)}
                className="text-[11px] text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                aria-label="Remove link"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <input
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
          placeholder="Label  (e.g. GitHub repo, Blog post)"
          className="border border-[#424242]/15 rounded-lg px-3 py-2 text-[12px] text-[#424242] outline-none focus:border-[#ffc000]/60 focus:ring-2 focus:ring-[#ffc000]/10 transition-all"
        />
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="https://github.com/…"
            className="flex-1 border border-[#424242]/15 rounded-lg px-3 py-2 text-[12px] text-[#424242] outline-none focus:border-[#ffc000]/60 focus:ring-2 focus:ring-[#ffc000]/10 transition-all"
          />
          <button
            onClick={add}
            disabled={!urlInput.trim()}
            className="px-4 py-2 bg-[#424242] text-white text-[12px] font-bold rounded-lg hover:bg-[#333] disabled:opacity-40 transition-all flex-shrink-0"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PinSelector ───────────────────────────────────────────────────────────────

export type PinType = 'work_experience' | 'education' | 'honours_awards';

export interface PinOption {
  type: PinType;
  id: number;
  label: string;
  icon: string;
}

export function PinSelector({
  options,
  pinnedType,
  pinnedId,
  onChange,
}: {
  options: PinOption[];
  pinnedType: PinType | null;
  pinnedId: number | null;
  onChange: (type: PinType | null, id: number | null) => void;
}) {
  if (options.length === 0) return null;

  const isSelected = (opt: PinOption) =>
    pinnedType === opt.type && pinnedId === opt.id;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#424242]/50">
        Pin to entry <span className="font-normal normal-case tracking-normal text-[#424242]/30">(optional — links this activity to a role, degree, or award)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {/* None pill */}
        <button
          onClick={() => onChange(null, null)}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
            !pinnedType
              ? "bg-[#424242] text-white border-[#424242]"
              : "bg-white text-[#424242]/60 border-[#424242]/20 hover:border-[#424242]/40"
          }`}
        >
          None
        </button>
        {options.map((opt) => (
          <button
            key={`${opt.type}-${opt.id}`}
            onClick={() => onChange(opt.type, opt.id)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 max-w-[200px] truncate ${
              isSelected(opt)
                ? "bg-[#ffc000] text-[#424242] border-[#ffc000]"
                : "bg-white text-[#424242]/60 border-[#424242]/20 hover:border-[#424242]/40"
            }`}
            title={opt.label}
          >
            <span>{opt.icon}</span>
            <span className="truncate">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
