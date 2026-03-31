"use client";

import { useEffect, useMemo, useState, type JSX } from "react";

export type RenderMode =
  | "document"
  | "table"
  | "scorecard"
  | "rule-matrix"
  | "two-column"
  | "legal-outline"
  | "memo"
  | "checklist"
  | "json-spec"
  | "card-grid";

export const VALID_RENDER_MODES: RenderMode[] = [
  "document",
  "table",
  "scorecard",
  "rule-matrix",
  "two-column",
  "legal-outline",
  "memo",
  "checklist",
  "json-spec",
  "card-grid",
];

interface DraftField {
  id: string;
  fieldName?: string;
  operator?: string | null;
  thresholdValue?: string | number | null;
  fieldValues?: string | number | null;
  documentNotes?: string | null;
  rules?: string | null;
  displayMode?: "document" | "table" | null;
}

interface DraftSubSection {
  id: string;
  name: string;
  documentNotes?: string | null;
  fields?: DraftField[];
  subFields?: DraftField[];
  subfields?: DraftField[];
  displayMode?: "document" | "table" | null;
}

interface DraftSection {
  id: string;
  name: string;
  documentNotes?: string | null;
  displayMode?: "document" | "table" | null;
  subTabs?: DraftSubSection[];
  subtabs?: DraftSubSection[];
}

export interface PolicyDraftData {
  name?: string;
  product?: string;
  version?: string | number;
  status?: string;
  startDate?: string | Date | null;
  description?: string;
  tabs?: DraftSection[];
}

export type SectionRenderModes = Record<string, RenderMode>;

interface PolicyDraftProps {
  data: PolicyDraftData;
  className?: string;
  renderMode?: RenderMode;
  sectionModes?: SectionRenderModes;
  onSectionModeChange?: (tabId: string, mode: RenderMode) => void;
  editable?: boolean;
  onChangeData?: (updated: PolicyDraftData) => void;
  fitContainer?: boolean;
}

function formatDate(value?: string | Date | null): string {
  if (!value) return "N/A";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatValue(field: DraftField): string {
  const value = field.thresholdValue ?? field.fieldValues;
  if (value === null || value === undefined || String(value).trim() === "") return "N/A";
  return String(value);
}

function getFullDisplayValue(field: DraftField): string {
  const value = field.fieldValues ?? field.thresholdValue;
  if (value === null || value === undefined || String(value).trim() === "") return "N/A";
  return String(value).trim();
}

function getNarrativeContent(field: DraftField): string {
  const preferred = [field.documentNotes, field.fieldValues, field.thresholdValue]
    .map((value) => String(value ?? "").trim())
    .find((value) => value.length > 0);
  return preferred || "";
}

function operatorToNatural(operator?: string | null, value?: string): string {
  const cleanValue = value && value.trim() ? value.trim() : "";
  const op = String(operator || "=").trim();
  if (!cleanValue) return op;
  return `${op} ${cleanValue}`;
}

function operatorToPolicyRequirement(operator?: string | null, value?: string): string {
  const cleanValue = value && value.trim() ? value.trim() : "";
  const op = String(operator || "=").trim().toLowerCase();

  if (!cleanValue) {
    if (op === ">=") return "must be at least";
    if (op === "<=") return "must not exceed";
    if (op === ">") return "must be greater than";
    if (op === "<") return "must be less than";
    if (op === "==" || op === "=") return "must be equal to";
    if (op === "between") return "must fall between";
    return "must satisfy";
  }

  if (op === ">=") return `must be at least ${cleanValue}`;
  if (op === "<=") return `must not exceed ${cleanValue}`;
  if (op === ">") return `must be greater than ${cleanValue}`;
  if (op === "<") return `must be less than ${cleanValue}`;
  if (op === "==" || op === "=") return `must be ${cleanValue}`;
  if (op === "between") return `must fall between ${cleanValue}`;

  return `must satisfy ${String(operator || "").trim()} ${cleanValue}`.trim();
}

function getOperatorTextForMemo(operator?: string | null): string {
  const normalized = String(operator || "").trim();
  if (normalized === ">=") return "be at least";
  if (normalized === "<=") return "not exceed";
  if (normalized === ">") return "exceed";
  if (normalized === "<") return "be less than";
  if (normalized === "==" || normalized === "=") return "be equal to";
  if (normalized.toLowerCase() === "between") return "fall between";
  return "be";
}

function getOperatorToneClass(operator?: string | null): string {
  const op = String(operator || "").trim().toLowerCase();
  if (op === ">=" || op === ">") return "bg-green-100 text-green-700";
  if (op === "<=" || op === "<") return "bg-red-100 text-red-700";
  if (op === "==" || op === "=") return "bg-blue-100 text-blue-700";
  if (op === "between") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-600";
}

function inferFieldTypeFromValue(field: DraftField): string {
  const value = field.thresholdValue ?? field.fieldValues;
  if (value === null || value === undefined || String(value).trim() === "") return "null";
  if (typeof value === "number") return "number";
  const text = String(value).trim();
  if (/^[-+]?\d+(?:\.\d+)?$/.test(text)) return "number";
  return "string";
}

function getSubSections(section: DraftSection): DraftSubSection[] {
  return section.subTabs || section.subtabs || [];
}

function getRules(subSection: DraftSubSection): DraftField[] {
  return subSection.fields || subSection.subFields || subSection.subfields || [];
}

const OFFICIAL_BODY_CLASS = "text-sm leading-8 text-slate-800";
const OFFICIAL_NOTE_CLASS = "text-sm italic leading-8 text-slate-600";
const OFFICIAL_RULE_TITLE_CLASS = "text-base font-semibold text-slate-900";

function joinClassNames(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function makeId(prefix: string): string {
  try {
    return `${prefix}-${crypto.randomUUID()}`;
  } catch {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}

function normalizeDraft(data: PolicyDraftData): PolicyDraftData {
  const tabs = (data.tabs || []).map((tab, tabIndex) => ({
    ...tab,
    id: tab.id || makeId(`tab-${tabIndex}`),
    displayMode: tab.displayMode || undefined,
    subTabs: getSubSections(tab).map((subTab, subIndex) => ({
      ...subTab,
      id: subTab.id || makeId(`subtab-${tabIndex}-${subIndex}`),
      displayMode: subTab.displayMode || "table",
      fields: getRules(subTab).map((field, fieldIndex) => ({
        ...field,
        id: field.id || makeId(`field-${tabIndex}-${subIndex}-${fieldIndex}`),
        displayMode: field.displayMode || undefined,
      })),
    })),
  }));

  return {
    ...data,
    tabs,
  };
}

function PageFooter({ policyName, pageNumber }: { policyName?: string; pageNumber: number }) {
  return (
    <div className="absolute inset-x-0 bottom-3 px-6 text-[11px] text-slate-500">
      <div className="relative h-4">
        <div className="absolute left-1/2 -translate-x-1/2 font-semibold text-slate-600">
          {policyName || "Policy Draft"}
        </div>
        <div className="absolute right-0">Page {pageNumber}</div>
      </div>
    </div>
  );
}

function JsonSpecBlock({ subSection }: { subSection: DraftSubSection }) {
  const [copied, setCopied] = useState(false);

  const payload = {
    id: subSection.id,
    name: subSection.name,
    fields: getRules(subSection).map((field) => ({
      fieldName: field.fieldName || null,
      fieldType: inferFieldTypeFromValue(field),
      operator: field.operator ?? null,
      thresholdValue: field.thresholdValue ?? null,
      fieldValues: field.fieldValues ?? null,
      rules: field.rules ?? null,
      documentNotes: field.documentNotes ?? null,
    })),
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const renderValue = (value: unknown, depth = 0): JSX.Element => {
    const pad = { paddingLeft: `${depth * 16}px` };
    if (value === null) {
      return <span className="text-slate-500">null</span>;
    }

    if (typeof value === "number") {
      return <span className="text-amber-400">{value}</span>;
    }

    if (typeof value === "string") {
      return <span className="text-green-400">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      return (
        <>
          <span className="text-slate-300">[</span>
          {value.map((item, index) => (
            <div key={`arr-${index}`} style={pad}>
              {renderValue(item, depth + 1)}
              {index < value.length - 1 ? <span className="text-slate-300">,</span> : null}
            </div>
          ))}
          <span className="text-slate-300">]</span>
        </>
      );
    }

    if (typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);
      return (
        <>
          <span className="text-slate-300">{"{"}</span>
          {entries.map(([key, val], index) => (
            <div key={key} style={pad}>
              <span className="text-blue-400">"{key}"</span>
              <span className="text-slate-300">: </span>
              {renderValue(val, depth + 1)}
              {index < entries.length - 1 ? <span className="text-slate-300">,</span> : null}
            </div>
          ))}
          <span className="text-slate-300">{"}"}</span>
        </>
      );
    }

    return <span className="text-green-400">"{String(value)}"</span>;
  };

  return (
    <div className="mb-4">
      <div className="mb-1 text-xs font-mono text-slate-500">{subSection.name || "Sub-section"}</div>
      <div className="relative rounded-lg bg-slate-900 p-4 text-xs font-mono overflow-x-auto">
        <button
          type="button"
          onClick={copyJson}
          className="absolute right-3 top-3 text-xs text-slate-400 transition hover:text-white"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <div className="pr-12">{renderValue(payload)}</div>
      </div>
    </div>
  );
}

function SectionModeBar({
  currentMode,
  onChange,
}: {
  currentMode: RenderMode;
  onChange: (mode: RenderMode) => void;
}) {
  const ICONS: Record<RenderMode, React.ReactNode> = {
    document: (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor">
        <rect x="0" y="2" width="18" height="2.5" rx="1.25"/>
        <rect x="0" y="8" width="13" height="2.5" rx="1.25"/>
        <rect x="0" y="14" width="15" height="2.5" rx="1.25"/>
      </svg>
    ),
    table: (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor">
        <rect x="0" y="0" width="8" height="5" rx="1.5"/>
        <rect x="10" y="0" width="8" height="5" rx="1.5"/>
        <rect x="0" y="7" width="8" height="5" rx="1.5"/>
        <rect x="10" y="7" width="8" height="5" rx="1.5"/>
        <rect x="0" y="14" width="8" height="4" rx="1.5"/>
        <rect x="10" y="14" width="8" height="4" rx="1.5"/>
      </svg>
    ),
    scorecard: (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor">
        <rect x="0" y="1" width="11" height="2.5" rx="1.25"/>
        <circle cx="16" cy="2.25" r="2"/>
        <rect x="0" y="8" width="11" height="2.5" rx="1.25"/>
        <circle cx="16" cy="9.25" r="2"/>
        <rect x="0" y="15" width="11" height="2.5" rx="1.25"/>
        <circle cx="16" cy="16.25" r="2"/>
      </svg>
    ),
    "rule-matrix": (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor">
        <rect x="0" y="0" width="7" height="18" rx="1" opacity="0.25"/>
        <rect x="11" y="0" width="7" height="18" rx="1" opacity="0.25"/>
        <rect x="8" y="0" width="2" height="18" rx="1"/>
      </svg>
    ),
    "two-column": (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor">
        <rect x="0" y="0" width="6" height="18" rx="1" opacity="0.5"/>
        <rect x="8" y="0" width="10" height="18" rx="1" opacity="0.25"/>
      </svg>
    ),
    "legal-outline": (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor">
        <rect x="0" y="1" width="16" height="2.5" rx="1.25"/>
        <rect x="3" y="6" width="13" height="2" rx="1"/>
        <rect x="6" y="11" width="10" height="2" rx="1"/>
        <rect x="3" y="15.5" width="13" height="2" rx="1"/>
      </svg>
    ),
    memo: (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor">
        <rect x="0" y="0" width="18" height="4" rx="1.5"/>
        <rect x="0" y="5" width="18" height="1" rx="0.5" opacity="0.4"/>
        <rect x="0" y="8" width="18" height="2" rx="1" opacity="0.3"/>
        <rect x="0" y="12" width="14" height="2" rx="1" opacity="0.3"/>
      </svg>
    ),
    checklist: (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor">
        <rect x="0" y="0" width="4" height="4" rx="1"/>
        <rect x="6" y="1" width="12" height="2" rx="1" opacity="0.5"/>
        <rect x="0" y="7" width="4" height="4" rx="1"/>
        <rect x="6" y="8" width="10" height="2" rx="1" opacity="0.5"/>
        <rect x="0" y="14" width="4" height="4" rx="1"/>
        <rect x="6" y="15" width="11" height="2" rx="1" opacity="0.5"/>
      </svg>
    ),
    "json-spec": (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor">
        <text x="1" y="15" fontSize="15" fontFamily="monospace">{`{}`}</text>
      </svg>
    ),
    "card-grid": (
      <svg width="14" height="14" viewBox="0 0 18 18" fill="currentColor">
        <rect x="0" y="0" width="8" height="8" rx="2"/>
        <rect x="10" y="0" width="8" height="8" rx="2"/>
        <rect x="0" y="10" width="8" height="8" rx="2"/>
        <rect x="10" y="10" width="8" height="8" rx="2"/>
      </svg>
    ),
  };

  const LABELS: Record<RenderMode, string> = {
    document: "Prose",
    table: "Table",
    scorecard: "Scorecard",
    "rule-matrix": "Rule Matrix",
    "two-column": "Two Column",
    "legal-outline": "Outline",
    memo: "Memo",
    checklist: "Checklist",
    "json-spec": "JSON",
    "card-grid": "Cards",
  };

  return (
    <div className="flex items-center gap-2 my-3 px-1">
      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
        Section view:
      </span>
      <div
        className="flex items-center gap-1 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {VALID_RENDER_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            title={LABELS[mode]}
            onClick={() => onChange(mode)}
            className={`
              flex-shrink-0 rounded-md p-1.5 transition-all duration-100
              ${currentMode === mode
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }
            `}
          >
            {ICONS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PolicyDraft({
  data,
  className,
  renderMode = "table",
  sectionModes,
  onSectionModeChange,
  onChangeData,
  fitContainer = false,
}: PolicyDraftProps) {
  const [draft, setDraft] = useState<PolicyDraftData>(() => normalizeDraft(data));
  const isEditMode = false;
  const incomingDataKey = JSON.stringify(data || {});

  useEffect(() => {
    setDraft(normalizeDraft(data));
  }, [incomingDataKey]);

  const applyDraftUpdate = (updater: (prev: PolicyDraftData) => PolicyDraftData) => {
    setDraft((prev) => {
      const updated = normalizeDraft(updater(prev));
      onChangeData?.(updated);
      return updated;
    });
  };

  const sections = draft.tabs || [];

  function renderSubSection(
    subSection: DraftSubSection,
    sectionIndex: number,
    subIndex: number,
    currentRenderMode: RenderMode
  ): JSX.Element {
    const rules = getRules(subSection);

    if (rules.length === 0) {
      return <p className="text-sm text-slate-600">No criteria listed.</p>;
    }

    if (currentRenderMode === "document") {
      return (
        <div className="space-y-2">
          {rules.map((rule, idx) => {
            const value = formatValue(rule);
            const policyRequirement = operatorToPolicyRequirement(rule.operator, value);
            return (
              <div key={rule.id || `${sectionIndex}-${subIndex}-document-${idx}`} className="py-1 text-sm">
                <p className={OFFICIAL_RULE_TITLE_CLASS}>{rule.fieldName || "Criteria"}</p>
                {rule.documentNotes ? (
                  <p className={`mt-1 ${OFFICIAL_BODY_CLASS}`}>{rule.documentNotes}</p>
                ) : (
                  <p className={`mt-1 ${OFFICIAL_NOTE_CLASS}`}>Requirement: {policyRequirement}</p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (currentRenderMode === "table") {
      return (
        <div className="overflow-hidden rounded-md border border-slate-300">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="w-1/3 border-b border-slate-300 px-4 py-3 font-semibold text-slate-700">Criteria</th>
                <th className="w-1/3 border-b border-slate-300 px-4 py-3 font-semibold text-slate-700">Requirement</th>
                <th className="w-1/3 border-b border-slate-300 px-4 py-3 font-semibold text-slate-700">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, idx) => {
                const value = getFullDisplayValue(rule);
                const requirement = operatorToPolicyRequirement(rule.operator, value);
                return (
                  <tr key={rule.id || `${sectionIndex}-${subIndex}-table-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="border-r border-b border-slate-200 px-4 py-3 align-top break-words">
                      <p className={OFFICIAL_RULE_TITLE_CLASS}>{rule.fieldName || "Unnamed Field"}</p>
                    </td>
                    <td className="border-r border-b border-slate-200 px-4 py-3 align-top break-words">
                      <p className={OFFICIAL_BODY_CLASS}>{requirement || "-"}</p>
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3 align-top break-words">
                      <p className={OFFICIAL_NOTE_CLASS}>{rule.documentNotes || getNarrativeContent(rule) || "-"}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (currentRenderMode === "scorecard") {
      return (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">{subSection.name || "Sub-section"}</p>
          <div className="border-l-2 border-slate-200 pl-3">
            {rules.map((rule, idx) => {
              const rawValue = getFullDisplayValue(rule);
              const hasValue = rawValue !== "N/A";
              return (
                <div key={rule.id || `${sectionIndex}-${subIndex}-score-${idx}`} className="flex items-center gap-2 border-b border-slate-200 py-2">
                  <span className={OFFICIAL_RULE_TITLE_CLASS}>{rule.fieldName || "Unnamed"}</span>
                  <span className="flex-1 border-b border-dotted border-slate-300" />
                  <span className="text-[10px] text-gray-500">{rule.operator || "="}</span>
                  {hasValue ? (
                    <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700 whitespace-pre-wrap break-words max-w-[60%]">
                      {rawValue}
                    </span>
                  ) : (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-400">Not set</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (currentRenderMode === "rule-matrix") {
      return (
        <div className="overflow-hidden rounded-md border border-slate-300">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-800 text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-2">Condition</th>
                <th className="px-4 py-2">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, idx) => {
                const value = getFullDisplayValue(rule);
                return (
                  <tr key={rule.id || `${sectionIndex}-${subIndex}-matrix-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="border-b border-slate-200 px-4 py-3 align-top">
                      <div className={OFFICIAL_RULE_TITLE_CLASS}>{rule.fieldName || "Unnamed Field"}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-[11px] ${getOperatorToneClass(rule.operator)}`}>{rule.operator || "="}</span>
                        <span className="font-mono text-xs text-slate-700 whitespace-pre-wrap break-words">{value}</span>
                      </div>
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3 align-top break-words">
                      <p className={OFFICIAL_BODY_CLASS}>
                      {getNarrativeContent(rule) || rule.rules || <span className="italic text-gray-500">APPROVE / REJECT / ESCALATE</span>}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (currentRenderMode === "two-column") {
      return (
        <div>
          {subSection.documentNotes ? (
            <p className="mb-4 rounded bg-slate-50 p-3 text-sm text-slate-700">{subSection.documentNotes}</p>
          ) : null}
          {rules.map((rule, idx) => {
            const value = getFullDisplayValue(rule);
            const requirement = operatorToPolicyRequirement(rule.operator, value);
            return (
              <div key={rule.id || `${sectionIndex}-${subIndex}-col-${idx}`} className="mb-3 border-b border-slate-100 pb-3">
                <div className="flex gap-3">
                  <div className="w-2/5 border-l-4 border-slate-200 pl-4">
                    <p className={OFFICIAL_RULE_TITLE_CLASS}>{rule.fieldName || "Criteria"}</p>
                    <p className={OFFICIAL_NOTE_CLASS}>{requirement}</p>
                  </div>
                  <div className="w-3/5">
                    <p className={`${OFFICIAL_BODY_CLASS} whitespace-pre-wrap break-words`}>{value}</p>
                    {rule.documentNotes ? <p className={`mt-1 ${OFFICIAL_NOTE_CLASS}`}>{rule.documentNotes}</p> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (currentRenderMode === "legal-outline") {
      return (
        <div className="font-serif text-black">
          <h3 className="pl-5 text-base font-bold uppercase tracking-wide">{sectionIndex + 1}.{subIndex + 1} {subSection.name || "Policy Sub-section"}</h3>
          <div className="mt-2 space-y-3 pl-5">
            {rules.map((rule, fieldIndex) => {
              const num = `${sectionIndex + 1}.${subIndex + 1}.${fieldIndex + 1}`;
              const value = formatValue(rule);
              const policyRequirement = operatorToPolicyRequirement(rule.operator, value);
              return (
                <div key={rule.id || `${sectionIndex}-${subIndex}-legal-${fieldIndex}`} className="pl-2">
                  <p className="text-[15px] text-slate-900">{num} {rule.fieldName || "Criteria"}</p>
                  {rule.documentNotes ? (
                    <p className="mt-1 pl-7 text-sm italic text-slate-700 leading-relaxed">{rule.documentNotes}</p>
                  ) : (
                    <p className="mt-1 pl-7 text-sm italic text-slate-500">Requirement: {policyRequirement}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (currentRenderMode === "memo") {
      const sentences = rules.map((rule) => {
        const value = getFullDisplayValue(rule);
        const main = `The ${rule.fieldName || "policy rule"} shall ${getOperatorTextForMemo(rule.operator)} ${value}.`;
        const extra = rule.documentNotes ? ` ${rule.documentNotes}` : "";
        return `${main}${extra}`;
      });

      return (
        <div>
          <h3 className="mb-3 border-b-2 border-slate-800 pb-1 text-sm font-bold uppercase">{subSection.name || "Sub-section"}</h3>
          {subSection.documentNotes ? <p className={`mb-2 ${OFFICIAL_NOTE_CLASS}`}>{subSection.documentNotes}</p> : null}
          <p className={`text-justify ${OFFICIAL_BODY_CLASS}`}>{sentences.join(" ")}</p>
        </div>
      );
    }

    if (currentRenderMode === "checklist") {
      return (
        <div>
          <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">{subSection.name || "Sub-section"}</p>
          {rules.map((rule, idx) => {
            const value = formatValue(rule);
            const requirement = operatorToPolicyRequirement(rule.operator, value);
            return (
              <div key={rule.id || `${sectionIndex}-${subIndex}-check-${idx}`} className="border-b border-slate-100 py-1.5">
                <div className="flex items-start">
                  <span className="mr-3 mt-0.5 inline-block h-4 w-4 flex-shrink-0 rounded-sm border-2 border-slate-400" />
                  <p className={OFFICIAL_RULE_TITLE_CLASS}>{rule.fieldName || "Criteria"}</p>
                </div>
                {rule.documentNotes ? (
                  <p className={`mt-1 pl-7 ${OFFICIAL_NOTE_CLASS}`}>{rule.documentNotes}</p>
                ) : (
                  <p className={`mt-1 pl-7 ${OFFICIAL_NOTE_CLASS}`}>Requirement: {requirement}</p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (currentRenderMode === "json-spec") {
      return <JsonSpecBlock subSection={subSection} />;
    }

    if (currentRenderMode === "card-grid") {
      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold">{subSection.name || "Sub-section"}</p>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{rules.length} rules</span>
          </div>
          {subSection.documentNotes ? (
            <p className="px-4 pt-3 text-xs italic text-slate-500">{subSection.documentNotes}</p>
          ) : null}
          <div className="space-y-2 px-4 pb-2">
            {rules.map((rule, idx) => {
              const value = getFullDisplayValue(rule);
              return (
                <div key={rule.id || `${sectionIndex}-${subIndex}-card-${idx}`}>
                  <p className={OFFICIAL_RULE_TITLE_CLASS}>{rule.fieldName || "Criteria"}</p>
                  <p className={`${OFFICIAL_BODY_CLASS} leading-relaxed`}>
                    <span className="mr-1 rounded bg-slate-100 px-1.5 py-0.5">{rule.operator || "="}</span>
                    {value}
                  </p>
                  {rule.documentNotes ? (
                    <p className={`mt-1 ${OFFICIAL_NOTE_CLASS}`}>{rule.documentNotes}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
          {subSection.documentNotes ? (
            <div className="border-t bg-slate-50 px-4 py-2 text-xs italic text-slate-400">{subSection.documentNotes}</div>
          ) : null}
        </div>
      );
    }

    return <p className="text-sm text-slate-600">Unsupported render mode.</p>;
  }

  const tocEntries = useMemo(() => {
    const entries: Array<{ label: string; page: number }> = [];
    sections.forEach((section, sectionIndex) => {
      const sectionPage = sectionIndex + 3;
      entries.push({ label: `${sectionIndex + 1}. ${section.name || "Major Policy Section"}`, page: sectionPage });
      const subSections = getSubSections(section);
      subSections.forEach((subSection, subIndex) => {
        entries.push({
          label: `${sectionIndex + 1}.${subIndex + 1} ${subSection.name || "Policy Sub-section"}`,
          page: sectionPage,
        });
      });
    });
    return entries;
  }, [sections]);

  return (
    <article
      className={joinClassNames(
        "relative mx-auto w-full rounded-sm border border-slate-300 bg-white p-6 text-slate-900 shadow-md print:shadow-none print:p-0",
        className
      )}
      style={{
        maxWidth: fitContainer ? "none" : "850px",
        fontFamily: "Cambria, Georgia, 'Times New Roman', serif",
      }}
    >
      <div className="space-y-6">
        <section className="relative min-h-[760px] border border-slate-200 p-6 pb-12">
          <div className="absolute right-6 top-6">
            {isEditMode ? (
              <input
                value={String(draft.status || "DRAFT")}
                onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, status: e.target.value }))}
                className="w-28 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-700"
              />
            ) : (
              <span className="rounded-full border border-slate-400 bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                {draft.status || "DRAFT"}
              </span>
            )}
          </div>

          <header className="mb-8 border-b-2 border-slate-700 pb-5 pr-28">
            {isEditMode ? (
              <>
                <input
                  value={draft.name || ""}
                  onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, name: e.target.value }))}
                  className="mb-2 w-full border-b border-slate-300 bg-transparent text-2xl font-bold leading-tight outline-none"
                  placeholder="Policy Name"
                />
                <textarea
                  value={draft.description || ""}
                  onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full resize-none rounded border border-slate-300 p-2 text-sm text-slate-700 outline-none"
                  rows={3}
                  placeholder="Policy description"
                />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold leading-tight">{draft.name || "Lending Policy"}</h1>
                <p className="mt-2 text-sm text-slate-700">{draft.description || "Comprehensive lending policy and assessment framework."}</p>
              </>
            )}
          </header>

          <section className="mb-8 break-inside-avoid">
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wide">Document Control</h2>
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr>
                  <td className="w-56 border border-slate-400 bg-slate-50 px-3 py-2 font-semibold">Policy Name</td>
                  <td className="border border-slate-400 px-3 py-2">
                    {isEditMode ? (
                      <input
                        value={draft.name || ""}
                        onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full border-none bg-transparent outline-none"
                      />
                    ) : (
                      draft.name || "N/A"
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 bg-slate-50 px-3 py-2 font-semibold">Product Code</td>
                  <td className="border border-slate-400 px-3 py-2">
                    {isEditMode ? (
                      <input
                        value={draft.product || ""}
                        onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, product: e.target.value }))}
                        className="w-full border-none bg-transparent outline-none"
                      />
                    ) : (
                      draft.product || "N/A"
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 bg-slate-50 px-3 py-2 font-semibold">Version</td>
                  <td className="border border-slate-400 px-3 py-2">
                    {isEditMode ? (
                      <input
                        value={String(draft.version || "")}
                        onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, version: e.target.value }))}
                        className="w-full border-none bg-transparent outline-none"
                      />
                    ) : (
                      draft.version || "N/A"
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 bg-slate-50 px-3 py-2 font-semibold">Effective Date</td>
                  <td className="border border-slate-400 px-3 py-2">
                    {isEditMode ? (
                      <input
                        type="date"
                        value={draft.startDate ? new Date(draft.startDate).toISOString().slice(0, 10) : ""}
                        onChange={(e) => applyDraftUpdate((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="w-full border-none bg-transparent outline-none"
                      />
                    ) : (
                      formatDate(draft.startDate)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <PageFooter policyName={draft.name} pageNumber={1} />
        </section>

        <section className="relative min-h-[760px] border border-slate-200 p-6 pb-12">
          <h2 className="mb-4 text-lg font-semibold uppercase tracking-wide">Table of Contents</h2>
          {tocEntries.length === 0 ? (
            <p className="text-sm text-slate-600">No sections available for index.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {tocEntries.map((entry, idx) => (
                <div key={`${entry.label}-${idx}`} className="flex items-center gap-3">
                  <span className="truncate text-slate-800">{entry.label}</span>
                  <span className="flex-1 border-b border-dotted border-slate-300" />
                  <span className="font-semibold text-slate-700">{entry.page}</span>
                </div>
              ))}
            </div>
          )}
          <PageFooter policyName={draft.name} pageNumber={2} />
        </section>

        <section className="space-y-6">
          {sections.length === 0 ? (
            <div className="relative min-h-[760px] border border-slate-200 p-6 pb-12">
              <p className="text-sm text-slate-600">No policy sections are available yet.</p>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    applyDraftUpdate((prev) => ({
                      ...prev,
                      tabs: [
                        ...(prev.tabs || []),
                        { id: makeId("tab"), name: "New Section", documentNotes: "", subTabs: [] },
                      ],
                    }));
                  }}
                  className="mt-3 rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Add Section
                </button>
              )}
              <PageFooter policyName={draft.name} pageNumber={3} />
            </div>
          ) : (
            sections.map((section, sectionIndex) => {
              const effectiveMode: RenderMode = sectionModes?.[section.id] ?? renderMode;
              const subSections = getSubSections(section);
              const pageNumber = sectionIndex + 3;

              return (
                <div key={section.id || `${sectionIndex}`} className="relative min-h-[760px] border border-slate-200 p-6 pb-12">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    {isEditMode ? (
                      <div className="w-full space-y-2">
                        <input
                          value={section.name || ""}
                          onChange={(e) => {
                            applyDraftUpdate((prev) => ({
                              ...prev,
                              tabs: (prev.tabs || []).map((item, idx) =>
                                idx === sectionIndex ? { ...item, name: e.target.value } : item
                              ),
                            }));
                          }}
                          className="w-full border-b border-slate-300 bg-transparent text-[19px] font-semibold outline-none"
                          placeholder="Section title"
                        />
                        <select
                          value={section.displayMode || "document"}
                          onChange={(e) => {
                            const mode = e.target.value as "document" | "table";
                            applyDraftUpdate((prev) => ({
                              ...prev,
                              tabs: (prev.tabs || []).map((item, idx) =>
                                idx === sectionIndex ? { ...item, displayMode: mode } : item
                              ),
                            }));
                          }}
                          className="h-8 rounded border border-slate-300 px-2 text-xs"
                        >
                          <option value="document">Tab: Document View</option>
                          <option value="table">Tab: Table View</option>
                        </select>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-[19px] font-semibold">
                          {sectionIndex + 1}. {section.name || "Major Policy Section"}
                        </h2>
                        {onSectionModeChange && (
                          <SectionModeBar
                            currentMode={effectiveMode}
                            onChange={(mode) => onSectionModeChange(section.id, mode)}
                          />
                        )}
                      </>
                    )}

                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => {
                          applyDraftUpdate((prev) => ({
                            ...prev,
                            tabs: (prev.tabs || []).filter((_, idx) => idx !== sectionIndex),
                          }));
                        }}
                        className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {isEditMode ? (
                    <textarea
                      value={section.documentNotes || ""}
                      onChange={(e) => {
                        applyDraftUpdate((prev) => ({
                          ...prev,
                          tabs: (prev.tabs || []).map((item, idx) =>
                            idx === sectionIndex ? { ...item, documentNotes: e.target.value } : item
                          ),
                        }));
                      }}
                      className="mb-4 w-full resize-none rounded border border-slate-300 p-2 text-sm leading-7 text-slate-700 outline-none"
                      rows={3}
                      placeholder="Section notes"
                    />
                  ) : section.documentNotes ? (
                    <p className="mb-4 text-sm leading-7 text-slate-700">{section.documentNotes}</p>
                  ) : null}

                  <div className={effectiveMode === "card-grid" && !isEditMode ? "grid grid-cols-1 gap-4 md:grid-cols-2" : "space-y-6"}>
                    {subSections.length === 0 ? (
                      <p className="text-sm text-slate-600">No policy sub-sections are available.</p>
                    ) : (
                      subSections.map((subSection, subIndex) => {
                        const rules = getRules(subSection);

                        return (
                          <div key={subSection.id || `${sectionIndex}-${subIndex}`} className="break-inside-avoid py-1">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              {isEditMode ? (
                                <div className="w-full space-y-2">
                                  <input
                                    value={subSection.name || ""}
                                    onChange={(e) => {
                                      applyDraftUpdate((prev) => ({
                                        ...prev,
                                        tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                          if (tabIdx !== sectionIndex) return tabItem;
                                          const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) =>
                                            currentSubIdx === subIndex ? { ...subItem, name: e.target.value } : subItem
                                          );
                                          return { ...tabItem, subTabs: updatedSubTabs };
                                        }),
                                      }));
                                    }}
                                    className="w-full border-b border-slate-300 bg-transparent text-base font-bold outline-none"
                                    placeholder="Sub-section title"
                                  />
                                  <select
                                    value={subSection.displayMode || "document"}
                                    onChange={(e) => {
                                      const mode = e.target.value as "document" | "table";
                                      applyDraftUpdate((prev) => ({
                                        ...prev,
                                        tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                          if (tabIdx !== sectionIndex) return tabItem;
                                          const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) =>
                                            currentSubIdx === subIndex ? { ...subItem, displayMode: mode } : subItem
                                          );
                                          return { ...tabItem, subTabs: updatedSubTabs };
                                        }),
                                      }));
                                    }}
                                    className="h-8 rounded border border-slate-300 px-2 text-xs"
                                  >
                                    <option value="document">Document View</option>
                                    <option value="table">Table View</option>
                                  </select>
                                </div>
                              ) : effectiveMode === "document" ? (
                                <h3 className="text-base font-bold underline decoration-slate-700 underline-offset-4">
                                  {sectionIndex + 1}.{subIndex + 1} {subSection.name || "Policy Sub-section"}
                                </h3>
                              ) : (
                                <div />
                              )}

                              {isEditMode && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    applyDraftUpdate((prev) => ({
                                      ...prev,
                                      tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                        if (tabIdx !== sectionIndex) return tabItem;
                                        return {
                                          ...tabItem,
                                          subTabs: getSubSections(tabItem).filter((_, idx) => idx !== subIndex),
                                        };
                                      }),
                                    }));
                                  }}
                                  className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            {isEditMode ? (
                              <textarea
                                value={subSection.documentNotes || ""}
                                onChange={(e) => {
                                  applyDraftUpdate((prev) => ({
                                    ...prev,
                                    tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                      if (tabIdx !== sectionIndex) return tabItem;
                                      const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) =>
                                        currentSubIdx === subIndex ? { ...subItem, documentNotes: e.target.value } : subItem
                                      );
                                      return { ...tabItem, subTabs: updatedSubTabs };
                                    }),
                                  }));
                                }}
                                className="mb-3 w-full resize-none rounded border border-slate-300 p-2 text-sm leading-7 text-slate-700 outline-none"
                                rows={2}
                                placeholder="Sub-section notes"
                              />
                            ) : subSection.documentNotes && effectiveMode !== "memo" && effectiveMode !== "card-grid" && effectiveMode !== "two-column" ? (
                              <p className="mb-3 text-sm leading-7 text-slate-700">{subSection.documentNotes}</p>
                            ) : null}

                            {!isEditMode ? (
                              <div className="space-y-3">
                                {renderSubSection(subSection, sectionIndex, subIndex, effectiveMode)}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {rules.length === 0 ? (
                                  <p className="text-sm text-slate-600">No criteria listed.</p>
                                ) : (
                                  rules.map((rule, ruleIndex) => {
                                    const value = formatValue(rule);
                                    const condition = operatorToNatural(rule.operator, value);
                                    return (
                                      <div key={rule.id || `${sectionIndex}-${subIndex}-${ruleIndex}`} className="rounded border border-slate-200 p-2 text-sm">
                                        {isEditMode ? (
                                          <div className="space-y-2">
                                            <div className="grid grid-cols-3 gap-2">
                                              <input
                                                value={rule.fieldName || ""}
                                                onChange={(e) => {
                                                  applyDraftUpdate((prev) => ({
                                                    ...prev,
                                                    tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                                      if (tabIdx !== sectionIndex) return tabItem;
                                                      const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                                        if (currentSubIdx !== subIndex) return subItem;
                                                        const updatedFields = getRules(subItem).map((fieldItem, currentFieldIdx) =>
                                                          currentFieldIdx === ruleIndex ? { ...fieldItem, fieldName: e.target.value } : fieldItem
                                                        );
                                                        return { ...subItem, fields: updatedFields };
                                                      });
                                                      return { ...tabItem, subTabs: updatedSubTabs };
                                                    }),
                                                  }));
                                                }}
                                                className="h-8 rounded border border-slate-300 px-2 text-xs"
                                                placeholder="Field"
                                              />
                                              <input
                                                value={String(rule.operator || "")}
                                                onChange={(e) => {
                                                  applyDraftUpdate((prev) => ({
                                                    ...prev,
                                                    tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                                      if (tabIdx !== sectionIndex) return tabItem;
                                                      const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                                        if (currentSubIdx !== subIndex) return subItem;
                                                        const updatedFields = getRules(subItem).map((fieldItem, currentFieldIdx) =>
                                                          currentFieldIdx === ruleIndex ? { ...fieldItem, operator: e.target.value } : fieldItem
                                                        );
                                                        return { ...subItem, fields: updatedFields };
                                                      });
                                                      return { ...tabItem, subTabs: updatedSubTabs };
                                                    }),
                                                  }));
                                                }}
                                                className="h-8 rounded border border-slate-300 px-2 text-xs"
                                                placeholder="Operator"
                                              />
                                              <input
                                                value={String(rule.thresholdValue ?? rule.fieldValues ?? "")}
                                                onChange={(e) => {
                                                  applyDraftUpdate((prev) => ({
                                                    ...prev,
                                                    tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                                      if (tabIdx !== sectionIndex) return tabItem;
                                                      const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                                        if (currentSubIdx !== subIndex) return subItem;
                                                        const updatedFields = getRules(subItem).map((fieldItem, currentFieldIdx) =>
                                                          currentFieldIdx === ruleIndex
                                                            ? { ...fieldItem, thresholdValue: e.target.value, fieldValues: e.target.value }
                                                            : fieldItem
                                                        );
                                                        return { ...subItem, fields: updatedFields };
                                                      });
                                                      return { ...tabItem, subTabs: updatedSubTabs };
                                                    }),
                                                  }));
                                                }}
                                                className="h-8 rounded border border-slate-300 px-2 text-xs"
                                                placeholder="Value"
                                              />
                                            </div>
                                            <textarea
                                              value={rule.documentNotes || ""}
                                              onChange={(e) => {
                                                applyDraftUpdate((prev) => ({
                                                  ...prev,
                                                  tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                                    if (tabIdx !== sectionIndex) return tabItem;
                                                    const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                                      if (currentSubIdx !== subIndex) return subItem;
                                                      const updatedFields = getRules(subItem).map((fieldItem, currentFieldIdx) =>
                                                        currentFieldIdx === ruleIndex ? { ...fieldItem, documentNotes: e.target.value } : fieldItem
                                                      );
                                                      return { ...subItem, fields: updatedFields };
                                                    });
                                                    return { ...tabItem, subTabs: updatedSubTabs };
                                                  }),
                                                }));
                                              }}
                                              className="w-full resize-none rounded border border-slate-300 p-2 text-xs outline-none"
                                              rows={2}
                                              placeholder="Rule notes"
                                            />
                                            <select
                                              value={rule.displayMode || "document"}
                                              onChange={(e) => {
                                                const mode = e.target.value as "document" | "table";
                                                applyDraftUpdate((prev) => ({
                                                  ...prev,
                                                  tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                                    if (tabIdx !== sectionIndex) return tabItem;
                                                    const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                                      if (currentSubIdx !== subIndex) return subItem;
                                                      const updatedFields = getRules(subItem).map((fieldItem, currentFieldIdx) =>
                                                        currentFieldIdx === ruleIndex ? { ...fieldItem, displayMode: mode } : fieldItem
                                                      );
                                                      return { ...subItem, fields: updatedFields };
                                                    });
                                                    return { ...tabItem, subTabs: updatedSubTabs };
                                                  }),
                                                }));
                                              }}
                                              className="h-8 rounded border border-slate-300 px-2 text-xs"
                                            >
                                              <option value="document">Field: Document View</option>
                                              <option value="table">Field: Table View</option>
                                            </select>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                applyDraftUpdate((prev) => ({
                                                  ...prev,
                                                  tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                                    if (tabIdx !== sectionIndex) return tabItem;
                                                    const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                                      if (currentSubIdx !== subIndex) return subItem;
                                                      return {
                                                        ...subItem,
                                                        fields: getRules(subItem).filter((_, idx) => idx !== ruleIndex),
                                                      };
                                                    });
                                                    return { ...tabItem, subTabs: updatedSubTabs };
                                                  }),
                                                }));
                                              }}
                                              className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                            >
                                              Remove Rule
                                            </button>
                                          </div>
                                        ) : (
                                          <>
                                            <div>
                                              <span className="font-semibold">{rule.fieldName || "Criteria"}</span>
                                              {condition ? (
                                                <>
                                                  <span className="mx-2 text-slate-400">-</span>
                                                  <span>{condition}</span>
                                                </>
                                              ) : null}
                                            </div>
                                            {rule.documentNotes && <p className="mt-1 text-sm text-slate-600 italic">{rule.documentNotes}</p>}
                                          </>
                                        )}
                                      </div>
                                    );
                                  })
                                )}

                                {isEditMode && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      applyDraftUpdate((prev) => ({
                                        ...prev,
                                        tabs: (prev.tabs || []).map((tabItem, tabIdx) => {
                                          if (tabIdx !== sectionIndex) return tabItem;
                                          const updatedSubTabs = getSubSections(tabItem).map((subItem, currentSubIdx) => {
                                            if (currentSubIdx !== subIndex) return subItem;
                                            return {
                                              ...subItem,
                                              fields: [
                                                ...getRules(subItem),
                                                {
                                                  id: makeId("field"),
                                                  fieldName: "New Rule",
                                                  operator: "==",
                                                  thresholdValue: "",
                                                  documentNotes: "",
                                                },
                                              ],
                                            };
                                          });
                                          return { ...tabItem, subTabs: updatedSubTabs };
                                        }),
                                      }));
                                    }}
                                    className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    Add Rule
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {isEditMode && (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          applyDraftUpdate((prev) => ({
                            ...prev,
                            tabs: (prev.tabs || []).map((item, idx) => {
                              if (idx !== sectionIndex) return item;
                              return {
                                ...item,
                                subTabs: [
                                  ...getSubSections(item),
                                  {
                                    id: makeId("subtab"),
                                    name: "New Sub-section",
                                    documentNotes: "",
                                    displayMode: "document",
                                    fields: [],
                                  },
                                ],
                              };
                            }),
                          }));
                        }}
                        className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Add Sub-section
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          applyDraftUpdate((prev) => ({
                            ...prev,
                            tabs: [
                              ...(prev.tabs || []),
                              { id: makeId("tab"), name: "New Section", documentNotes: "", subTabs: [] },
                            ],
                          }));
                        }}
                        className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Add Section
                      </button>
                    </div>
                  )}

                  <PageFooter policyName={draft.name} pageNumber={pageNumber} />
                </div>
              );
            })
          )}
        </section>
      </div>
    </article>
  );
}
