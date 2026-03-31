"use client";

import { useMemo, useState } from "react";
import type { Tab } from "@/types";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import PolicyDraft, { type PolicyDraftData, type RenderMode } from "@/components/policy-builder/PolicyDraft";

interface LivePolicyDraftProps {
  policyId: string;
  tabs: Tab[];
  policyName?: string;
  policyDescription?: string;
  policyProduct?: string;
  policyVersion?: string | number;
  policyStatus?: string;
  policyStartDate?: string | Date | null;
  storageKey?: string;
}

export default function LivePolicyDraft({
  policyId,
  tabs,
  policyName,
  policyDescription,
  policyProduct,
  policyVersion,
  policyStatus,
  policyStartDate,
  storageKey,
}: LivePolicyDraftProps) {
  const [isDraftOpen, setIsDraftOpen] = useState(true);
  const [renderMode] = useState<RenderMode>("table");

  const draftData = useMemo<PolicyDraftData>(
    () => ({
      name: policyName || `Policy ${policyId}`,
      product: policyProduct,
      version: policyVersion,
      status: policyStatus,
      startDate: policyStartDate,
      description: policyDescription,
      tabs,
    }),
    [policyDescription, policyId, policyName, policyProduct, policyStartDate, policyStatus, policyVersion, tabs]
  );

  return (
    <aside className="h-full overflow-y-auto bg-slate-200/70 p-3 sm:p-4">
      <div className="sticky top-0 z-20 mb-4 rounded-lg border bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-2 text-slate-800">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-slate-700" />
            <h3 className="text-sm font-semibold tracking-wide">Document Preview</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDraftOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-sm ml-2"
            >
              {isDraftOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {isDraftOpen ? "Close Draft" : "Open Draft"}
            </button>
          </div>
        </div>
        
        {isDraftOpen && (
          <div className="mt-1.5 text-[11px] text-slate-500">View mode: Table (standardized)</div>
        )}
      </div>

      {!isDraftOpen ? (
        <div className="mx-auto rounded-lg border bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
          Draft preview is closed. Click <span className="font-semibold">Open Draft</span> to view the policy.
        </div>
      ) : (
        <PolicyDraft 
          data={draftData} 
          renderMode={renderMode} 
        />
      )}
    </aside>
  );
}
