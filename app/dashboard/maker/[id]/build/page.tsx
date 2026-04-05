"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveTabId, setStep } from "@/store/slices/policySlice";
import { useBlocks, useCreateBlock, useUpdateBlock, useDeleteBlock } from "@/hooks/useBlocks";
import api from "@/lib/api";
import { buildBackendAiUrl } from "@/lib/backendAiUrl";
import toast from "react-hot-toast";
import type { PolicyField, Tab } from "@/types";
import { ChevronDown, ChevronUp, PanelLeftClose, PanelLeftOpen, Plus, Trash2, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import SimulationSheet from "@/components/simulation/SimulationSheet";
import PolicyChatPopup from "@/components/policy-builder/PolicyChatPopup";
import BlockEditor from "@/components/policy-builder/BlockEditor";
import DraftEditor from "@/components/policy-builder/DraftEditor";

const BLOCK_TYPES = [
  { id: "section", name: "Section" },
  { id: "heading", name: "Heading" },
  { id: "paragraph", name: "Paragraph" },
  { id: "kv_pair", name: "Key / Value" },
  { id: "list", name: "List" },
  { id: "table", name: "Table" },
  { id: "number_rule", name: "Number Rule" },
  { id: "divider", name: "Divider" },
];

export default function BuildPolicyPage() {
  const params = useParams<{ id: string | string[] }>();
  const policyId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";

  const router = useRouter();
  const dispatch = useAppDispatch();

  const [isSimOpen, setIsSimOpen] = useState(false);
  const [showFieldRail, setShowFieldRail] = useState(true);
  const [showHeaderDetails, setShowHeaderDetails] = useState(true);
  const [isDraftPanelOpen, setIsDraftPanelOpen] = useState(false);
  const [draftViewMode, setDraftViewMode] = useState<any>("document");
  const [sectionModes, setSectionModes] = useState<any>({});
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<{ market?: any; structure?: any; consistency?: any } | null>(null);
  const [lastReviewedAt, setLastReviewedAt] = useState<string | null>(null);
  const [policyMeta, setPolicyMeta] = useState<{
    name?: string;
    description?: string;
    product?: string;
    version?: string | number;
    status?: string;
    startDate?: string;
  }>({});
  const [selectedBlockType, setSelectedBlockType] = useState<string>("paragraph");
  const role = String(useAppSelector((state) => state.auth.user?.role || "")).toUpperCase();

  const { data: blocks = [], isLoading } = useBlocks(policyId);
  const createBlockMutation = useCreateBlock();
  const updateBlockMutation = useUpdateBlock();
  const deleteBlockMutation = useDeleteBlock();

  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const sortedBlocks = useMemo(() => {
    return [...blocks].filter((b) => !b.parentId).sort((a, b) => a.orderIndex - b.orderIndex);
  }, [blocks]);

  // Get child blocks for a specific parent
  const getChildBlocks = (parentId: string) => {
    return blocks.filter((b) => b.parentId === parentId).sort((a, b) => a.orderIndex - b.orderIndex);
  };

  // Helper to generate default content for each block type
  const getDefaultContent = (blockType: string) => {
    switch (blockType) {
      case "section":
        return { description: "" };
      case "heading":
        return { level: 2, text: "New Heading" };
      case "paragraph":
        return { text: "" };
      case "kv_pair":
        return { key: "", value: "", unit: "" };
      case "list":
        return { items: [], ordered: false };
      case "table":
        return { columns: [], rows: [] };
      case "number_rule":
        return { name: "", operator: "=", value: 0, unit: "" };
      case "divider":
        return {};
      default:
        return {};
    }
  };

  // Extract number_rule blocks for BRE/simulation
  const allFields = useMemo<PolicyField[]>(
    () =>
      sortedBlocks
        .filter((b) => b.type === "number_rule")
        .map((block: any, index: number) => ({
          id: block.id,
          fieldName: String(block.label || block.content?.name || `Rule ${index}`),
          fieldType: "number",
          operator: block.operator || block.content?.operator || null,
          thresholdValue: String(block.numericValue ?? block.content?.value ?? "N/A"),
          rules: null,
          documentNotes: block.content?.description || null,
        })),
    [sortedBlocks]
  );

  const normalizeList = (items: any): string[] => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => String(item || "").trim()).filter(Boolean);
  };

  const runPrecautionaryReview = async (currentBlocks: any[]) => {
    setReviewLoading(true);
    setReviewError(null);

    const firstNumberRule = currentBlocks.find((b) => b.type === "number_rule");
    const firstField = firstNumberRule || { fieldName: "General Policy Health", thresholdValue: "N/A" };

    const policyData = {
      id: policyId,
      name: policyMeta.name,
      product: policyMeta.product,
      version: policyMeta.version,
      status: policyMeta.status,
      description: policyMeta.description,
      blocks: currentBlocks,
    };

    const [{ data: marketData }, { data: structureData }, { data: consistencyData }] = await Promise.all([
      api.post(buildBackendAiUrl("/api/agents/market-intelligence"), {
        policy_type: policyMeta.product || "general",
        field: firstField.fieldName || "Policy Parameter",
        value: firstField.thresholdValue ?? firstField.fieldValues ?? "N/A",
        context: {
          policy_name: policyMeta.name,
          description: policyMeta.description,
          total_blocks: currentBlocks.length,
        },
      }),
      api.post(buildBackendAiUrl("/api/agents/structure-analysis"), {
        policy_type: policyMeta.product || "general",
        policy_data: policyData,
      }),
      api.post(buildBackendAiUrl("/api/agents/consistency-audit"), {
        policy_type: policyMeta.product || "general",
        policy_data: policyData,
      }),
    ]);

    setReviewData({ market: marketData, structure: structureData, consistency: consistencyData });
    setLastReviewedAt(new Date().toLocaleTimeString());
    setReviewError(null);
    setReviewLoading(false);
  };

  useEffect(() => {
    if (!policyId) return;

    let isMounted = true;

    api.get(`/policy/${policyId}?_t=${Date.now()}`)
      .then(({ data }) => {
        if (!isMounted) return;
        setPolicyMeta({
          name: data?.data?.name,
          description: data?.data?.description,
          product: data?.data?.product,
          version: data?.data?.version,
          status: data?.data?.status,
          startDate: data?.data?.startDate || data?.data?.effectiveDate || data?.data?.createdAt,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setPolicyMeta({});
      });

    return () => {
      isMounted = false;
    };
  }, [policyId]);

  useEffect(() => {
    if (sortedBlocks.length === 0) {
      if (editingBlockId !== null) {
        setEditingBlockId(null);
      }
      return;
    }

    const existsInCurrentPolicy = sortedBlocks.some((block) => block.id === editingBlockId);
    if (!existsInCurrentPolicy && editingBlockId) {
      setEditingBlockId(sortedBlocks[0]?.id || null);
    }
  }, [sortedBlocks, editingBlockId]);

  useEffect(() => {
    if (!policyId || sortedBlocks.length === 0) {
      setReviewData(null);
      setReviewError(null);
      setLastReviewedAt(null);
    }
  }, [policyId, sortedBlocks.length]);

  const handleFinalSubmit = async () => {
    if (!policyId) {
      toast.error("Invalid policy ID");
      return;
    }

    const loadingToast = toast.loading("Submitting policy to queue...");
    try {
      await api.post("/approval", { action: "SUBMIT", policyId });
      toast.success("Policy submitted for review!", { id: loadingToast });
      dispatch(setStep(1));
      router.push("/dashboard");
    } catch {
      toast.error("Failed to submit policy", { id: loadingToast });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-soft">
        <div className="animate-pulse font-semibold text-blue-700">Loading Policy Engine...</div>
      </div>
    );
  }

  if (role !== "MAKER") {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-soft">
        <div className="max-w-md rounded-xl border bg-white p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Read-only for this role</h2>
          <p className="mt-2 text-sm text-gray-500">Only MAKER can edit policy blocks.</p>
          <button
            onClick={() => router.push(`/dashboard/policy/${policyId}`)}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white"
          >
            Back to Policy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-soft">
      <header className="animate-fade-in-down border-b bg-white/90 px-8 py-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>{showHeaderDetails && <h2 className="text-xl text-gray-500">Policy ID: {policyId}</h2>}</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHeaderDetails((prev) => !prev)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              <span className="inline-flex items-center gap-2">
                {showHeaderDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showHeaderDetails ? "Hide Details" : "Show Details"}
              </span>
            </button>

            <PolicyChatPopup
              currentPolicy={{
                id: policyId,
                name: policyMeta.name,
                description: policyMeta.description,
                product: policyMeta.product,
                version: policyMeta.version,
                status: policyMeta.status,
                startDate: policyMeta.startDate,
                blocks: sortedBlocks,
              }}
              policyId={policyId}
              onPolicyUpdate={() => window.location.reload()}
            />

            <button
              onClick={() => setShowFieldRail((prev) => !prev)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              <span className="inline-flex items-center gap-2">
                {showFieldRail ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                {showFieldRail ? "Hide Fields" : "Show Fields"}
              </span>
            </button>

            <button
              onClick={() => setIsSimOpen(true)}
              className="rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-all hover:bg-blue-50"
            >
              Test Rules
            </button>
            <button
              onClick={() => {
                setIsAnalysisPanelOpen((prev) => !prev);
                setIsDraftPanelOpen(false);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              {isAnalysisPanelOpen ? "Hide Analysis" : "Show Analysis"}
            </button>
            <button
              onClick={() => {
                setIsDraftPanelOpen((prev) => !prev);
                setIsAnalysisPanelOpen(false);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              {isDraftPanelOpen ? "Hide Draft" : "Show Draft"}
            </button>
            <button
              onClick={handleFinalSubmit}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              Create Policy
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div
          className={`animate-fade-in-down overflow-x-auto border-b bg-white/90 px-6 transition-all duration-300 backdrop-blur ${showHeaderDetails ? "max-h-24 py-3 opacity-100" : "max-h-0 border-b-0 py-0 opacity-0"
            }`}
        >
          <div className="flex items-center gap-2">
            <h3 className="mr-4 text-xs font-bold uppercase tracking-wider text-gray-400">Blocks:</h3>
            <div className="flex gap-2 flex-wrap">
              {sortedBlocks.slice(0, 5).map((block) => (
                <button
                  key={block.id}
                  onClick={() => setEditingBlockId(block.id)}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                  {block.label || block.type}
                </button>
              ))}
              {sortedBlocks.length > 5 && (
                <span className="px-3 py-1 text-xs text-gray-500">+{sortedBlocks.length - 5} more</span>
              )}
            </div>
          </div>
        </div>

        <section className="relative flex flex-1 overflow-hidden">
          {showFieldRail && (
            <aside className="animate-slide-in-left w-80 overflow-y-auto border-r bg-white/90 p-4 backdrop-blur">
              <div className="sticky top-0 mb-4 border-b bg-white/90 pb-3 backdrop-blur">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Document Structure</p>
                <h3 className="text-sm font-bold text-gray-900">Blocks</h3>
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Select Block Type</label>
                  <Select value={selectedBlockType} onValueChange={setSelectedBlockType}>
                    <SelectTrigger className="w-full h-9 text-sm border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOCK_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={async () => {
                    const maxOrder = sortedBlocks.length > 0 ? Math.max(...sortedBlocks.map((b) => b.orderIndex)) : 0;
                    try {
                      await createBlockMutation.mutateAsync({
                        policyId,
                        type: selectedBlockType,
                        label: BLOCK_TYPES.find((t) => t.id === selectedBlockType)?.name || "New Block",
                        content: getDefaultContent(selectedBlockType),
                        orderIndex: maxOrder + 1,
                      });
                      toast.success(`${selectedBlockType} block added`);
                    } catch (error: any) {
                      toast.error(error?.message || "Failed to add block");
                    }
                  }}
                >
                  <Plus size={16} className="mr-2" /> Add Block
                </Button>
              </div>

              <div className="space-y-1">
                {sortedBlocks.map((block) => (
                  <div key={block.id}>
                    {/* Parent Block */}
                    <div
                      className={`rounded-md p-2.5 cursor-pointer transition-all ${
                        editingBlockId === block.id
                          ? "bg-blue-100 border border-blue-400 shadow-sm"
                          : "bg-white border border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setEditingBlockId(block.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{block.label || block.type}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{block.type}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this block?")) {
                              deleteBlockMutation.mutate(block.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Child Blocks */}
                    {getChildBlocks(block.id).length > 0 && (
                      <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-300 pl-3">
                        {getChildBlocks(block.id).map((child) => (
                          <div
                            key={child.id}
                            className={`rounded-md p-2 cursor-pointer transition-all text-xs ${
                              editingBlockId === child.id
                                ? "bg-blue-100 border border-blue-400"
                                : "bg-white border border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => setEditingBlockId(child.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-700 truncate">{child.label || child.type}</p>
                                <p className="text-gray-400 text-xs mt-0.5">{child.type}</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Delete this child block?")) {
                                    deleteBlockMutation.mutate(child.id);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 flex-shrink-0"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {sortedBlocks.length === 0 && (
                  <div className="rounded-md border border-dashed border-gray-300 p-4 text-center">
                    <p className="text-xs text-gray-500">No blocks yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add one using the form above</p>
                  </div>
                )}
              </div>
            </aside>
          )}

          <div
            className={`flex-1 space-y-6 overflow-y-auto p-6 transition-all duration-300 ${isDraftPanelOpen || isAnalysisPanelOpen ? "lg:pr-172" : ""
              }`}
          >
            <div className="mx-auto max-w-4xl animate-fade-in-up">
              {editingBlockId ? (
                <BlockEditor
                  blockId={editingBlockId}
                  block={sortedBlocks.find((b) => b.id === editingBlockId)}
                  childBlocks={getChildBlocks(editingBlockId)}
                  onUpdate={(updates) => {
                    updateBlockMutation.mutate({
                      blockId: editingBlockId,
                      ...updates,
                    });
                    toast.success("Block updated");
                  }}
                  onClose={() => setEditingBlockId(null)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-400 animate-fade-in">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                    <span className="text-2xl">📋</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600">No block selected</p>
                  <p className="text-xs text-gray-500 mt-2">Select a block from the left sidebar to edit</p>
                </div>
              )}
            </div>
          </div>

          <aside
            className={`absolute inset-y-0 right-0 z-20 w-full max-w-5xl border-l bg-gray-50 shadow-xl transition-transform duration-300 ${isDraftPanelOpen ? "translate-x-0" : "translate-x-full"
              }`}
          >
            <DraftEditor
              blocks={blocks}
              policyMeta={policyMeta}
              onContentChange={(html) => {
                // Save to local state if needed
              }}
            />
          </aside>

          <aside
            className={`absolute inset-y-0 right-0 z-20 w-full max-w-2xl border-l bg-white shadow-xl transition-transform duration-300 ${isAnalysisPanelOpen ? "translate-x-0" : "translate-x-full"
              }`}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Precautionary AI Review</h3>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-1 text-[11px] font-semibold ${reviewError ? "bg-red-100 text-red-700" : reviewLoading ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {reviewError ? "Review Failed" : reviewLoading ? "Review Running" : reviewData ? "Review Generated" : "Not Run"}
                    </span>
                    <button
                      onClick={() => {
                        runPrecautionaryReview(sortedBlocks).catch((error: any) => {
                          setReviewError(error?.message || "Failed to run 3-agent review");
                          setReviewLoading(false);
                        });
                      }}
                      className="rounded border px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-gray-500">{lastReviewedAt ? `Last updated at ${lastReviewedAt}` : "Manual mode: click Refresh to run analysis"}</p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  {reviewError ? <p className="text-xs text-red-600">{reviewError}</p> : null}

                  {!reviewData ? (
                    <p className="text-xs text-gray-500">Analysis is manual-only to save tokens. Click Refresh when needed.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded border bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-800">Market Analyst</p>
                        <p className="mt-1 text-xs text-gray-700">{reviewData.market?.risk_score || "No risk score"}</p>
                        <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1 text-[11px] text-gray-600">
                          {normalizeList(reviewData.market?.recommendations).slice(0, 5).map((item, idx) => (
                            <li key={`mr-panel-${idx}`}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded border bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-800">Structure Analyst</p>
                        <p className="mt-1 text-xs text-gray-700">{reviewData.structure?.completeness_score || "No score"}</p>
                        <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1 text-[11px] text-gray-600">
                          {normalizeList(reviewData.structure?.improvements).slice(0, 5).map((item, idx) => (
                            <li key={`sr-panel-${idx}`}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded border bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-800">Consistency Auditor</p>
                        <p className="mt-1 text-xs text-gray-700">{reviewData.consistency?.status || "No status"}</p>
                        <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1 text-[11px] text-gray-600">
                          {normalizeList(reviewData.consistency?.corrections).slice(0, 5).map((item, idx) => (
                            <li key={`cr-panel-${idx}`}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </section>

        {isSimOpen && (
          <div className="absolute inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
            <div className="animate-slide-in-right relative w-full max-w-md">
              <button
                onClick={() => setIsSimOpen(false)}
                className="absolute -left-10 top-4 rounded-l-md border-y border-l bg-white p-2 shadow-md"
              >
                X
              </button>
              <SimulationSheet policyId={policyId} fields={allFields} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

