"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { unwrapApiData } from "@/lib/unwrapApiData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCheckers } from "@/hooks/useCheckers";
import PolicyDraft from "@/components/policy-builder/PolicyDraft";
import { buildBackendAiUrl } from "@/lib/backendAiUrl";
import { ArrowRight, Eye, FilePlus2, FolderUp, LayoutTemplate, Paperclip, Sparkles, UploadCloud } from "lucide-react";
import {
  PREDEFINED_POLICY_TEMPLATES,
  buildDraftPreviewFromTemplate,
  getPolicyTemplateById,
  getPolicyTemplateStats,
} from "@/lib/policyTemplates";

type ExtractionTriple = {
  subject?: string;
  relation?: string;
  object?: string;
  chunk_index?: number;
  section?: string;
};

type ChunkPreview = {
  section?: string;
  preview?: string;
};

type NormalizedField = {
  fieldName?: string;
  fieldType?: string;
  operator?: string;
  thresholdValue?: string;
  fieldValues?: string;
  rules?: string;
  documentNotes?: string;
  orderIndex?: number;
  displayMode?: string;
};

type NormalizedSubtab = {
  name?: string;
  orderIndex?: number;
  documentNotes?: string;
  displayMode?: string;
  fields?: NormalizedField[];
};

type NormalizedTab = {
  name?: string;
  orderIndex?: number;
  documentNotes?: string;
  subtabs?: NormalizedSubtab[];
};

type SectionBucket = {
  sectionName: string;
  minChunk: number;
  triples: ExtractionTriple[];
};

type PolicyCreateResponse = {
  id: string;
};

type ExistingPolicyOption = {
  id: string;
  name: string;
  version: string;
  product: string;
};

export default function CreatePolicyPage() {
  const router = useRouter();
  const { data: checkers = [] } = useCheckers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    product: "",
    status: "DRAFT",
    version: "v1.0",
    description: "",
    checkerId: "",
  });

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("blank");
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [workflowTrack, setWorkflowTrack] = useState<"build" | "extract_only">("build");
  const [buildMode, setBuildMode] = useState<"new" | "existing_changes">("new");
  const [existingPolicies, setExistingPolicies] = useState<ExistingPolicyOption[]>([]);
  const [selectedBasePolicyId, setSelectedBasePolicyId] = useState<string>("");
  const [changeMode, setChangeMode] = useState<"annexure" | "update">("annexure");
  const [extractOnlyFile, setExtractOnlyFile] = useState<File | null>(null);
  const [extractOnlyLoading, setExtractOnlyLoading] = useState(false);
  const [extractOnlyResult, setExtractOnlyResult] = useState<any>(null);

  useEffect(() => {
    if (workflowTrack !== "build" || buildMode !== "existing_changes") return;

    let active = true;
    api
      .get("/policy/getAll")
      .then(({ data }) => {
        if (!active) return;
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        const normalized = list
          .filter((item: any) => item?.id && item?.name)
          .map((item: any) => ({
            id: String(item.id),
            name: String(item.name),
            version: String(item.version || "v1.0"),
            product: String(item.product || "GENERAL"),
          }));
        setExistingPolicies(normalized);
      })
      .catch(() => {
        if (!active) return;
        setExistingPolicies([]);
      });

    return () => {
      active = false;
    };
  }, [workflowTrack, buildMode]);

  const humanizeRelation = (relation?: string) => {
    const raw = String(relation || "").trim();
    if (!raw) return "Rule";
    return raw
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const toFieldType = (value?: string) => {
    const text = String(value || "").trim();
    if (!text) return "text";
    if (/^[-+]?\d+(?:\.\d+)?$/.test(text)) return "number";
    if (/\d/.test(text) && /(rs\.?|lakh|crore|%|month|year|score|age|tenure|tenor)/i.test(text)) return "number";
    return "text";
  };

  const normalizeSectionName = (section?: string, fallback = "General Rules") => {
    const name = String(section || "").trim();
    if (!name) return fallback;

    // Clean numeric-only headings like "5" / "6" to be more descriptive.
    const numericOnly = /^\d+(?:\.\d+)?$/.test(name);
    if (numericOnly) return `Section ${name}`;

    const normalized = name.replace(/^section\s+/i, "Section ");
    return normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized;
  };

  const inferOperator = (relation?: string) => {
    const rel = String(relation || "").toUpperCase();
    if (rel.includes("MAX")) return "<=";
    if (rel.includes("MIN")) return ">=";
    if (rel.includes("RANGE")) return "between";
    return "=";
  };

  const themeConfig = [
    { key: "overview", name: "Overview & Business Context", keywords: ["objective", "purpose", "business model", "segment", "partner", "model", "target"] },
    { key: "eligibility", name: "Eligibility & Applicant Profile", keywords: ["eligibility", "age", "cibil", "experience", "profile", "borrower", "applicant"] },
    { key: "loan-terms", name: "Loan Terms & Limits", keywords: ["loan amount", "tenure", "tenor", "facility", "term loan", "max loan", "min loan"] },
    { key: "pricing", name: "Pricing, Interest & Charges", keywords: ["interest", "rate", "fee", "charge", "penal", "pre closure", "processing", "%"] },
    { key: "documentation", name: "Documentation & KYC", keywords: ["document", "kyc", "proof", "registration", "itr", "statement", "ownership"] },
    { key: "repayment", name: "Repayment & Collections", keywords: ["repayment", "emi", "installment", "moratorium", "delinquency", "collection", "sanction"] },
    { key: "collateral", name: "Collateral & Security", keywords: ["collateral", "ltv", "mortgage", "security", "property", "lien"] },
  ] as const;

  const classifyTheme = (triple: ExtractionTriple) => {
    const text = `${triple.subject || ""} ${triple.relation || ""} ${triple.object || ""} ${triple.section || ""}`.toLowerCase();
    for (const theme of themeConfig) {
      if (theme.keywords.some((kw) => text.includes(kw))) {
        return theme.key;
      }
    }
    return "overview";
  };

  const seedPolicyStructureFromTriples = async (
    policyId: string,
    filename: string,
    triples: ExtractionTriple[],
    chunkPreview: ChunkPreview[] = [],
  ) => {
    const validTriples = (triples || []).filter(
      (t) => String(t?.subject || "").trim() && String(t?.relation || "").trim() && String(t?.object || "").trim()
    );

    const normalizedChunkPreview = (chunkPreview || [])
      .filter((chunk) => String(chunk?.preview || "").trim())
      .slice(0, 120);

    const fallbackTriplesFromChunks: ExtractionTriple[] =
      validTriples.length > 0
        ? []
        : normalizedChunkPreview.map((chunk, index) => ({
            subject: "Policy",
            relation: "CONTAINS_SECTION_CONTENT",
            object: String(chunk.preview || "").trim(),
            chunk_index: index,
            section: String(chunk.section || `Section ${index + 1}`).trim(),
          }));

    const sourceTriples = validTriples.length > 0 ? validTriples : fallbackTriplesFromChunks;

    if (sourceTriples.length === 0) return;

    // Keep write volume bounded for large docs.
    const cappedTriples = sourceTriples.slice(0, 500);

    // De-duplicate exact semantic triples so draft is less noisy.
    const dedupSet = new Set<string>();
    const dedupedTriples = cappedTriples.filter((t) => {
      const key = `${String(t.subject || "").trim().toLowerCase()}|${String(t.relation || "").trim().toLowerCase()}|${String(t.object || "").trim().toLowerCase()}`;
      if (dedupSet.has(key)) return false;
      dedupSet.add(key);
      return true;
    });

    // Group by thematic tab -> section subtab.
    const themeBuckets = new Map<string, Map<string, SectionBucket>>();
    for (const triple of dedupedTriples) {
      const theme = classifyTheme(triple);
      const sectionName = normalizeSectionName(triple.section, "General Rules");
      const chunk = Number.isFinite(Number(triple.chunk_index)) ? Number(triple.chunk_index) : 0;

      if (!themeBuckets.has(theme)) themeBuckets.set(theme, new Map());
      const sectionMap = themeBuckets.get(theme)!;

      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, {
          sectionName,
          minChunk: chunk,
          triples: [],
        });
      }

      const bucket = sectionMap.get(sectionName)!;
      bucket.minChunk = Math.min(bucket.minChunk, chunk);
      bucket.triples.push(triple);
    }

    let tabOrderIndex = 0;
    for (const theme of themeConfig) {
      const sectionMap = themeBuckets.get(theme.key);
      if (!sectionMap || sectionMap.size === 0) continue;

      const allThemeTriples = Array.from(sectionMap.values()).flatMap((b) => b.triples);

      const { data: tabRes } = await api.post("/tab/createTab", {
        name: theme.name,
        policyEngineId: policyId,
        orderIndex: tabOrderIndex,
        documentNotes: `Auto-generated from ${filename}. ${allThemeTriples.length} extracted rules grouped under ${sectionMap.size} sections.`,
      });
      tabOrderIndex += 1;

      const createdTab = unwrapApiData<any>(tabRes);
      const tabId = createdTab?.id;
      if (!tabId) {
        throw new Error(`Failed to create tab: ${theme.name}`);
      }

      const orderedSections = Array.from(sectionMap.values()).sort((a, b) => a.minChunk - b.minChunk);

      for (let subtabIndex = 0; subtabIndex < orderedSections.length; subtabIndex += 1) {
        const section = orderedSections[subtabIndex];

        const { data: subtabRes } = await api.post("/subtab/create", {
          name: section.sectionName,
          orderIndex: subtabIndex,
          documentNotes: `Extracted from ${filename}. ${section.triples.length} rules. Earliest source chunk: ${section.minChunk}.`,
          displayMode: "table",
          tabId,
        });

        const createdSubtab = unwrapApiData<any>(subtabRes);
        const subTabId = createdSubtab?.id;
        if (!subTabId) {
          throw new Error(`Failed to create subtab: ${section.sectionName}`);
        }

        const seenFieldNames = new Set<string>();
        for (let fieldIndex = 0; fieldIndex < section.triples.length; fieldIndex += 1) {
          const triple = section.triples[fieldIndex];
          const relationLabel = humanizeRelation(triple.relation);
          const subjectLabel = String(triple.subject || "").trim();

          const compactSubject = ["loan", "borrower", "applicant", "business", "collateral"].includes(subjectLabel.toLowerCase())
            ? subjectLabel
            : "Policy";

          const baseFieldName = `${compactSubject} - ${relationLabel}`;
          let fieldName = baseFieldName;
          let suffix = 2;
          while (seenFieldNames.has(fieldName.toLowerCase())) {
            fieldName = `${baseFieldName} ${suffix}`;
            suffix += 1;
          }
          seenFieldNames.add(fieldName.toLowerCase());

          await api.post("/field/create", {
            fieldName,
            fieldType: toFieldType(String(triple.object || "")),
            operator: inferOperator(triple.relation),
            thresholdValue: String(triple.object || "").slice(0, 500),
            rules: String(triple.relation || ""),
            documentNotes: `Source subject: ${subjectLabel || "N/A"}. Section: ${section.sectionName}. Chunk: ${Number(triple.chunk_index ?? 0)}.`,
            orderIndex: fieldIndex,
            subTabId,
          });
        }
      }
    }
  };

  const seedPolicyStructureFromNormalizedDraft = async (
    policyId: string,
    filename: string,
    tabs: NormalizedTab[],
  ) => {
    const validTabs = (tabs || []).filter((tab) => String(tab?.name || "").trim());
    if (validTabs.length === 0) return;

    for (let tabIndex = 0; tabIndex < validTabs.length; tabIndex += 1) {
      const tabDef = validTabs[tabIndex];
      const { data: tabRes } = await api.post("/tab/createTab", {
        name: String(tabDef.name || `Tab ${tabIndex + 1}`).trim(),
        policyEngineId: policyId,
        orderIndex: Number.isFinite(Number(tabDef.orderIndex)) ? Number(tabDef.orderIndex) : tabIndex,
        documentNotes: tabDef.documentNotes || `Normalized from extraction output for ${filename}`,
      });

      const createdTab = unwrapApiData<any>(tabRes);
      const tabId = createdTab?.id;
      if (!tabId) {
        throw new Error(`Failed to create normalized tab: ${String(tabDef.name || tabIndex + 1)}`);
      }

      const subtabs = Array.isArray(tabDef.subtabs) ? tabDef.subtabs : [];
      for (let subtabIndex = 0; subtabIndex < subtabs.length; subtabIndex += 1) {
        const subtabDef = subtabs[subtabIndex];
        const { data: subtabRes } = await api.post("/subtab/create", {
          name: String(subtabDef.name || `Section ${subtabIndex + 1}`).trim(),
          orderIndex: Number.isFinite(Number(subtabDef.orderIndex)) ? Number(subtabDef.orderIndex) : subtabIndex,
          documentNotes: subtabDef.documentNotes || `Normalized section from ${filename}`,
          displayMode: subtabDef.displayMode || "table",
          tabId,
        });

        const createdSubtab = unwrapApiData<any>(subtabRes);
        const subTabId = createdSubtab?.id;
        if (!subTabId) {
          throw new Error(`Failed to create normalized subtab: ${String(subtabDef.name || subtabIndex + 1)}`);
        }

        const fields = Array.isArray(subtabDef.fields) ? subtabDef.fields : [];
        for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex += 1) {
          const fieldDef = fields[fieldIndex];
          const fallbackName = `Rule ${fieldIndex + 1}`;

          await api.post("/field/create", {
            fieldName: String(fieldDef.fieldName || fallbackName).trim(),
            fieldType: fieldDef.fieldType || toFieldType(fieldDef.thresholdValue || fieldDef.fieldValues || ""),
            operator: fieldDef.operator || "=",
            thresholdValue: String(fieldDef.thresholdValue || "").slice(0, 500),
            fieldValues: String(fieldDef.fieldValues || "").slice(0, 500),
            rules: String(fieldDef.rules || "").slice(0, 250),
            documentNotes: fieldDef.documentNotes || `Normalized field from ${filename}`,
            orderIndex: Number.isFinite(Number(fieldDef.orderIndex)) ? Number(fieldDef.orderIndex) : fieldIndex,
            subTabId,
          });
        }
      }
    }
  };

  const seedPolicyStructureFromTemplate = async (policyId: string, templateId: string) => {
    const template = getPolicyTemplateById(templateId);
    if (!template) return;

    for (let tabIndex = 0; tabIndex < template.tabs.length; tabIndex += 1) {
      const tabDef = template.tabs[tabIndex];
      const { data: tabRes } = await api.post("/tab/createTab", {
        name: tabDef.name,
        policyEngineId: policyId,
        orderIndex: tabIndex,
        documentNotes: tabDef.documentNotes || `Seeded from template: ${template.name}`,
      });

      const createdTab = unwrapApiData<any>(tabRes);
      const tabId = createdTab?.id;
      if (!tabId) {
        throw new Error(`Failed to create template tab: ${tabDef.name}`);
      }

      for (let subtabIndex = 0; subtabIndex < tabDef.subtabs.length; subtabIndex += 1) {
        const subtabDef = tabDef.subtabs[subtabIndex];
        const { data: subtabRes } = await api.post("/subtab/create", {
          name: subtabDef.name,
          orderIndex: subtabIndex,
          documentNotes: subtabDef.documentNotes || `Template section from ${template.name}`,
          displayMode: subtabDef.displayMode || "document",
          tabId,
        });

        const createdSubtab = unwrapApiData<any>(subtabRes);
        const subTabId = createdSubtab?.id;
        if (!subTabId) {
          throw new Error(`Failed to create template subtab: ${subtabDef.name}`);
        }

        for (let fieldIndex = 0; fieldIndex < subtabDef.fields.length; fieldIndex += 1) {
          const fieldDef = subtabDef.fields[fieldIndex];
          await api.post("/field/create", {
            fieldName: fieldDef.fieldName,
            fieldType: fieldDef.fieldType,
            operator: fieldDef.operator || "=",
            thresholdValue: fieldDef.thresholdValue || "",
            fieldValues: fieldDef.fieldValues || "",
            rules: fieldDef.rules || "",
            documentNotes: fieldDef.documentNotes || `Template field from ${template.name}`,
            orderIndex: fieldIndex,
            subTabId,
          });
        }
      }
    }
  };

  const extractAndSeedPolicy = async (policyId: string) => {
    if (!attachedFile) return;

    setExtracting(true);
    const form = new FormData();
    form.append("file", attachedFile);
    form.append("llm_provider", "azure-foundry");
    form.append("async", "false");

    const { data } = await api.post(
      buildBackendAiUrl("/api/extraction/upload-policy"),
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    const result = data?.result || {};
    const normalizedTabs: NormalizedTab[] = Array.isArray(result?.frontend_ready?.draft_structure?.tabs)
      ? result.frontend_ready.draft_structure.tabs
      : [];

    if (normalizedTabs.length > 0) {
      await seedPolicyStructureFromNormalizedDraft(policyId, attachedFile.name, normalizedTabs);
      setExtracting(false);
      return;
    }

    const triples: ExtractionTriple[] = Array.isArray(result?.triples) ? result.triples : [];
    const chunkPreview: ChunkPreview[] = Array.isArray(result?.chunks_preview) ? result.chunks_preview : [];
    await seedPolicyStructureFromTriples(policyId, attachedFile.name, triples, chunkPreview);
    setExtracting(false);
  };

  const extractToPineconeOnly = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("llm_provider", "azure-foundry");
    form.append("async", "false");

    const { data } = await api.post(
      buildBackendAiUrl("/api/extraction/upload-policy"),
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return data;
  };

  const handleExistingPolicyChanges = async () => {
    if (!selectedBasePolicyId) {
      throw new Error("Select an existing policy to continue");
    }

    const selectedPolicy = existingPolicies.find((policy) => policy.id === selectedBasePolicyId);
    const baseVersion = selectedPolicy?.version || "v1.0";

    if (changeMode === "annexure") {
      const annexureVersion = `${baseVersion}-annexure-${Date.now()}`;
      await api.post("/policy/version", {
        policyId: selectedBasePolicyId,
        versionNumber: annexureVersion,
        changeNote: "Annexure draft created from existing policy workflow",
      });
    }

    if (attachedFile) {
      await extractAndSeedPolicy(selectedBasePolicyId);
      toast.success("Existing policy updated with extracted draft blocks and rules");
    }

    router.push(`/dashboard/maker/${selectedBasePolicyId}/build?mode=${changeMode}`);
  };

  const handleExtractOnly = async () => {
    if (!extractOnlyFile) {
      throw new Error("Please attach a policy document for extraction");
    }

    setExtractOnlyLoading(true);
    const result = await extractToPineconeOnly(extractOnlyFile);
    setExtractOnlyResult(result);
    setExtractOnlyLoading(false);
    toast.success("Document extracted and sent to Pinecone successfully");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (workflowTrack === "extract_only") {
      const loadingToast = toast.loading("Extracting policy and storing in Pinecone...");
      try {
        await handleExtractOnly();
        toast.success("Extraction pipeline completed", { id: loadingToast });
      } catch (error: any) {
        toast.error(String(error?.response?.data?.message || error?.message || "Extraction failed"), {
          id: loadingToast,
        });
      } finally {
        setExtractOnlyLoading(false);
      }
      return;
    }

    if (buildMode === "existing_changes") {
      const loadingToast = toast.loading(
        changeMode === "annexure"
          ? "Creating annexure flow from existing policy..."
          : "Opening existing policy change workflow..."
      );

      try {
        await handleExistingPolicyChanges();
        toast.success("Existing policy workflow is ready", { id: loadingToast });
      } catch (error: any) {
        toast.error(String(error?.response?.data?.message || error?.message || "Failed to start existing policy workflow"), {
          id: loadingToast,
        });
      }
      return;
    }

    const loadingToast = toast.loading(attachedFile ? "Creating policy and importing file..." : "Creating policy...");
    try {
      let effectiveName = formData.name.trim();
      if (!effectiveName && attachedFile) {
        effectiveName = attachedFile.name.replace(/\.[^.]+$/, "");
      }

      if (!effectiveName) {
        toast.error("Policy name is required", { id: loadingToast });
        return;
      }

      const payload = {
        ...formData,
        name: effectiveName,
        product:
          formData.product ||
          getPolicyTemplateById(selectedTemplateId)?.product ||
          "GENERAL",
      };

      const { data } = await api.post("/policy/create", payload);
      const createdPolicy = unwrapApiData<PolicyCreateResponse>(data);

      if (attachedFile) {
        await extractAndSeedPolicy(createdPolicy.id);
      } else if (selectedTemplateId !== "blank") {
        await seedPolicyStructureFromTemplate(createdPolicy.id, selectedTemplateId);
      }

      toast.success(attachedFile ? "Policy created and draft imported!" : "Policy created!", { id: loadingToast });
      router.push(`/dashboard/maker/${createdPolicy.id}/build`);
    } catch (error: any) {
      const msg = String(error?.response?.data?.message || error?.message || "Failed to create policy");
      toast.error(msg, { id: loadingToast });
    } finally {
      setExtracting(false);
    }
  };

  const selectedTemplate = getPolicyTemplateById(selectedTemplateId);
  const previewTemplate = getPolicyTemplateById(previewTemplateId);

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Hero Section + Setup Options */}
      <div className="mb-8 grid gap-6 grid-cols-[1.4fr_0.9fr] bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-3xl border border-slate-200 shadow-sm p-8">
        <div>
          <div className="flex gap-2 mb-4">
            <Badge className="bg-blue-100 text-blue-700 border-0">New Policy</Badge>
            <Badge className="bg-emerald-100 text-emerald-700 border-0">Guided Setup</Badge>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Create a New Policy</h2>
          <p className="text-slate-600 leading-relaxed">
            Start by importing an existing policy document, choosing a governed template, or building a fresh policy with AI assistance.
          </p>
        </div>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div className="font-semibold text-slate-900 mb-4">Setup Options</div>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-slate-500 font-medium mb-1">Import path</div>
                <div className="text-slate-900">Existing document to structured policy</div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="text-slate-500 font-medium mb-1">Template path</div>
                <div className="text-slate-900">Reusable policy framework to new draft</div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="text-slate-500 font-medium mb-1">Recommended for</div>
                <div className="text-slate-900">Both fresh creation and policy migration</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Three-Column Card Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Card 1: Import Existing Policy */}
        <Card className="bg-white border-slate-200 flex flex-col hover:shadow-md transition-shadow">
          <CardContent className="p-6 space-y-4 flex flex-col h-full">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-lg font-bold text-slate-900">Import Existing Policy</h3>
                <Badge className="bg-amber-100 text-amber-700 border-0 whitespace-nowrap flex-shrink-0">Migration</Badge>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bring in an existing policy document and convert it into structured tabs, subtabs, and fields.
              </p>
            </div>

            <div className="space-y-2">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                Best for migrating approved legacy policies
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                Maps source clauses into builder-ready sections
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                Useful when policy exists in Word or PDF
              </div>
            </div>

            <Button
              className="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => router.push("/dashboard/maker/create/existing")}
            >
              Import Existing Policy
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Use Existing Template */}
        <Card className="bg-white border-slate-200 flex flex-col hover:shadow-md transition-shadow">
          <CardContent className="p-6 space-y-4 flex flex-col h-full">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-lg font-bold text-slate-900">Use Existing Template</h3>
                <Badge className="bg-blue-100 text-blue-700 border-0 whitespace-nowrap flex-shrink-0">Recommended</Badge>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Start from a governed template and create a new policy draft on top of that structure.
              </p>
            </div>

            <div className="space-y-2">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                Best for fresh policy creation with standard controls
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                Keeps mandatory blocks and reusable clauses intact
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                Lets teams create variants faster with consistency
              </div>
            </div>

            <Button
              className="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => {
                setWorkflowTrack("build");
                setBuildMode("new");
                setSelectedTemplateId("blank");
              }}
            >
              Choose Template
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Card 3: Create From Scratch */}
        <Card className="bg-white border-slate-200 flex flex-col hover:shadow-md transition-shadow">
          <CardContent className="p-6 space-y-4 flex flex-col h-full">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-lg font-bold text-slate-900">Create From Scratch</h3>
                <Badge className="bg-emerald-100 text-emerald-700 border-0 whitespace-nowrap flex-shrink-0">Blank Policy</Badge>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Start a completely blank policy or use AI to generate the initial structure and rule set.
              </p>
            </div>

            <div className="space-y-2">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                Best for first-time or custom governance policies
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                AI generates initial structure, controls, and workflow
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                Useful when no existing template or document fits
              </div>
            </div>

            <Button
              className="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => router.push("/dashboard/maker/create/blank")}
            >
              Create Blank Policy
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
