"use client";

import type { JSX } from "react";

import type { RenderMode } from "./PolicyDraft";

type RenderModeSelectorProps = {
  value: RenderMode;
  onChange: (mode: RenderMode) => void;
  className?: string;
};

type ModeMeta = {
  mode: RenderMode;
  label: string;
  icon: JSX.Element;
};

const MODES: ModeMeta[] = [
  {
    mode: "document",
    label: "Prose",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="0" y="2" width="16" height="2" rx="1" />
        <rect x="0" y="7" width="12" height="2" rx="1" />
        <rect x="0" y="12" width="14" height="2" rx="1" />
      </svg>
    ),
  },
  {
    mode: "table",
    label: "Table",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="0" y="0" width="7" height="4" rx="1" />
        <rect x="9" y="0" width="7" height="4" rx="1" />
        <rect x="0" y="6" width="7" height="4" rx="1" />
        <rect x="9" y="6" width="7" height="4" rx="1" />
        <rect x="0" y="12" width="7" height="4" rx="1" />
        <rect x="9" y="12" width="7" height="4" rx="1" />
      </svg>
    ),
  },
  {
    mode: "scorecard",
    label: "Scorecard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="0" y="2" width="10" height="2" rx="1" />
        <circle cx="14" cy="3" r="2" />
        <rect x="0" y="7" width="10" height="2" rx="1" />
        <circle cx="14" cy="8" r="2" />
        <rect x="0" y="12" width="10" height="2" rx="1" />
        <circle cx="14" cy="13" r="2" />
      </svg>
    ),
  },
  {
    mode: "rule-matrix",
    label: "Rules",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="0" y="0" width="6" height="16" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="10" y="0" width="6" height="16" rx="1" fill="currentColor" opacity="0.3" />
        <line x1="8" y1="0" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    mode: "two-column",
    label: "Columns",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="0" y="0" width="5" height="16" rx="1" opacity="0.4" />
        <rect x="7" y="0" width="9" height="16" rx="1" opacity="0.2" />
      </svg>
    ),
  },
  {
    mode: "legal-outline",
    label: "Outline",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="0" y="1" width="14" height="2" rx="1" />
        <rect x="3" y="5" width="11" height="2" rx="1" />
        <rect x="6" y="9" width="8" height="2" rx="1" />
        <rect x="3" y="13" width="11" height="2" rx="1" />
      </svg>
    ),
  },
  {
    mode: "memo",
    label: "Memo",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="0" y="0" width="16" height="3" rx="1" />
        <rect x="0" y="4" width="16" height="1" rx="0.5" opacity="0.5" />
        <rect x="0" y="7" width="16" height="1.5" rx="0.5" opacity="0.3" />
        <rect x="0" y="10" width="12" height="1.5" rx="0.5" opacity="0.3" />
        <rect x="0" y="13" width="14" height="1.5" rx="0.5" opacity="0.3" />
      </svg>
    ),
  },
  {
    mode: "checklist",
    label: "Checklist",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="0" y="1" width="3" height="3" rx="0.5" />
        <rect x="5" y="2" width="11" height="1.5" rx="0.5" opacity="0.5" />
        <rect x="0" y="7" width="3" height="3" rx="0.5" />
        <rect x="5" y="8" width="9" height="1.5" rx="0.5" opacity="0.5" />
        <rect x="0" y="13" width="3" height="3" rx="0.5" />
        <rect x="5" y="14" width="10" height="1.5" rx="0.5" opacity="0.5" />
      </svg>
    ),
  },
  {
    mode: "json-spec",
    label: "JSON",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <text x="1" y="13" fontSize="14" fontFamily="monospace" opacity="0.8">{"{}"}</text>
      </svg>
    ),
  },
  {
    mode: "card-grid",
    label: "Cards",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="0" y="0" width="7" height="7" rx="1.5" />
        <rect x="9" y="0" width="7" height="7" rx="1.5" />
        <rect x="0" y="9" width="7" height="7" rx="1.5" />
        <rect x="9" y="9" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
];

export default function RenderModeSelector({ value, onChange, className }: RenderModeSelectorProps) {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide ${className || ""}`}>
      {MODES.map((item) => {
        const isActive = item.mode === value;
        return (
          <button
            key={item.mode}
            type="button"
            onClick={() => onChange(item.mode)}
            className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              isActive
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
