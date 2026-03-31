"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, DatabaseZap, FileStack, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { buildBackendAiUrl } from "@/lib/backendAiUrl";
import { unwrapApiData } from "@/lib/unwrapApiData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

type ExtractionResponse = {
  status?: string;
  job_id?: string;
  filename?: string;
  llm_provider?: string;
  policy_name?: string;
  stats?: {
    total_chars?: number;
    raw_chars?: number;
    total_chunks?: number;
    total_triples?: number;
    total_tables?: number;
  };
  result?: {
    policy_name?: string;
    triples?: ExtractionTriple[];
    tables?: Array<{
      table_index?: number;
      headers?: string[];
      row_count?: number;
      preview_rows?: string[][];
    }>;
    chunks_preview?: ChunkPreview[];
    frontend_ready?: {
      draft_structure?: {
        tabs?: NormalizedTab[];
      };
    };
    pinecone_db?: {
      stored?: boolean;
      index_name?: string;
    };
  };
  pinecone_db?: {
    stored?: boolean;
    index_name?: string;
  };
};

type FrontendJsonResponse = {
  ok?: boolean;
  job_id?: string;
  status?: string;
  schema_version?: string;
  frontend_ready?: {
    draft_structure?: {
      tabs?: NormalizedTab[];
    };
  };
};

export default function UploadExistingPolicyPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"changes" | "bre_rules">("changes");
  const [postAction, setPostAction] = useState<"ai_chat" | "annexure">("ai_chat");
  const [changePrompt, setChangePrompt] = useState("");
  const [changesFile, setChangesFile] = useState<File | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftProduct, setDraftProduct] = useState("");
  const [draftVersion, setDraftVersion] = useState("v1.0");
  const [draftDescription, setDraftDescription] = useState("");
  const [detectedTabs, setDetectedTabs] = useState<NormalizedTab[]>([]);
  const [extractedResult, setExtractedResult] = useState<ExtractionResponse | null>(null);
  const [breFile, setBreFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [breResult, setBreResult] = useState<ExtractionResponse | null>(null);

  const changesFileRef = useRef<HTMLInputElement>(null);
  const breFileRef = useRef<HTMLInputElement>(null);

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

  const normalizeSectionName = (section?: string) => {
    const name = String(section || "").trim();
    if (!name) return "";
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

  const runExtractionUpload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("llm_provider", "azure-foundry");
    form.append("async", "false");

    const { data } = await api.post(buildBackendAiUrl("/api/extraction/upload-policy"), form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const extraction = data as ExtractionResponse;
    const jobId = String(extraction?.job_id || "").trim();

    if (!jobId) {
      throw new Error("Extraction job id is missing");
    }

    const { data: frontendData } = await api.get(
      buildBackendAiUrl(`/api/extraction/upload-policy/${jobId}/frontend-json`)
    );
    const frontend = frontendData as FrontendJsonResponse;
    const frontendTabs = frontend?.frontend_ready?.draft_structure?.tabs;

    if (!Array.isArray(frontendTabs) || frontendTabs.length === 0) {
      throw new Error("frontend-json returned no tabs");
    }

    return {
      ...extraction,
      result: {
        ...(extraction.result || {}),
        frontend_ready: {
          ...(extraction.result?.frontend_ready || {}),
          draft_structure: {
            tabs: frontendTabs,
          },
        },
      },
    } as ExtractionResponse;
  };

  const buildNormalizedTabsFromTriples = (
    triples: ExtractionTriple[],
  ): NormalizedTab[] => {
    const validTriples = (triples || []).filter(
      (t) => String(t?.subject || "").trim() && String(t?.relation || "").trim() && String(t?.object || "").trim()
    );

    const sourceTriples = validTriples;
    if (sourceTriples.length === 0) return [];

    const cappedTriples = sourceTriples.slice(0, 500);
    const dedupSet = new Set<string>();
    const dedupedTriples = cappedTriples.filter((t) => {
      const key = `${String(t.subject || "").trim().toLowerCase()}|${String(t.relation || "").trim().toLowerCase()}|${String(t.object || "").trim().toLowerCase()}`;
      if (dedupSet.has(key)) return false;
      dedupSet.add(key);
      return true;
    });

    const themeBuckets = new Map<string, Map<string, SectionBucket>>();
    for (const triple of dedupedTriples) {
      const theme = classifyTheme(triple);
      const sectionName = normalizeSectionName(triple.section) || String(triple.subject || triple.relation || "").trim();
      if (!sectionName) continue;
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

    const tabs: NormalizedTab[] = [];
    let tabOrder = 0;
    for (const theme of themeConfig) {
      const sectionMap = themeBuckets.get(theme.key);
      if (!sectionMap || sectionMap.size === 0) continue;

      const orderedSections = Array.from(sectionMap.values()).sort((a, b) => a.minChunk - b.minChunk);
      const subtabs: NormalizedSubtab[] = orderedSections.map((section, subtabIndex) => {
        const seenFieldNames = new Set<string>();
        const fields: NormalizedField[] = section.triples.map((triple, fieldIndex) => {
          const relationLabel = humanizeRelation(triple.relation);
          const subjectLabel = String(triple.subject || "").trim();
          const compactSubject = ["loan", "borrower", "applicant", "business", "collateral"].includes(subjectLabel.toLowerCase())
            ? subjectLabel
            : (subjectLabel || section.sectionName || relationLabel);

          const baseFieldName = `${compactSubject} - ${relationLabel}`;
          let fieldName = baseFieldName;
          let suffix = 2;
          while (seenFieldNames.has(fieldName.toLowerCase())) {
            fieldName = `${baseFieldName} ${suffix}`;
            suffix += 1;
          }
          seenFieldNames.add(fieldName.toLowerCase());

          return {
            fieldName,
            fieldType: toFieldType(String(triple.object || "")),
            operator: inferOperator(triple.relation),
            thresholdValue: String(triple.object || "").slice(0, 500),
            rules: String(triple.relation || ""),
            documentNotes: String(triple.object || "").slice(0, 500),
            orderIndex: fieldIndex,
          };
        });

        return {
          name: section.sectionName,
          orderIndex: subtabIndex,
          documentNotes: section.triples.map((triple) => String(triple.object || "").trim()).find(Boolean) || "",
          displayMode: "table",
          fields,
        };
      });

      tabs.push({
        name: theme.name,
        orderIndex: tabOrder,
        documentNotes: subtabs.map((subtab) => String(subtab.documentNotes || "").trim()).find(Boolean) || "",
        subtabs,
      });
      tabOrder += 1;
    }

    return tabs;
  };

  const extractEditableTabs = async (file: File): Promise<{ tabs: NormalizedTab[]; extracted: ExtractionResponse }> => {
    const extracted = await runExtractionUpload(file);
    const normalizedTabs: NormalizedTab[] = Array.isArray(extracted?.result?.frontend_ready?.draft_structure?.tabs)
      ? extracted.result!.frontend_ready!.draft_structure!.tabs!
      : [];

    if (normalizedTabs.length > 0) {
      return { tabs: normalizedTabs, extracted };
    }

    throw new Error("frontend-json draft tabs are missing");
  };

  const sanitizeExtractedTabs = (tabs: NormalizedTab[]): NormalizedTab[] => {
    const cleanText = (value?: string) => String(value || "").replace(/\s+/g, " ").trim();
    const isNoiseValue = (value?: string) => {
      const v = cleanText(value).toLowerCase();
      if (!v) return true;
      if (v === "{}" || v === "[]") return true;
      if (v.includes("normalized from extraction output")) return true;
      if (v.includes("auto-normalized from")) return true;
      if (v.includes("source section:")) return true;
      if (v.includes("extracted from ")) return true;
      if (v.includes("auto-generated from ")) return true;
      if (v.includes("imported from ")) return true;
      if (v.includes("section view")) return true;
      if (v.includes("small business loanpage")) return true;
      if (v.length > 1200) return true;
      return false;
    };

    const normalized = (tabs || [])
      .map((tab, tabIndex) => {
        const subtabs = (tab.subtabs || [])
          .map((subtab, subtabIndex) => {
            const fields = (subtab.fields || [])
              .map((field, fieldIndex) => {
                const threshold = cleanText(field.thresholdValue);
                const fieldValues = cleanText(field.fieldValues);
                const rules = cleanText(field.rules);
                const fieldName = cleanText(field.fieldName);
                if (!fieldName) return null;

                const cleanedThreshold = isNoiseValue(threshold) ? "" : threshold.slice(0, 160);
                const cleanedFieldValues = isNoiseValue(fieldValues) ? "" : fieldValues.slice(0, 240);
                const cleanedSourceNote = cleanText(field.documentNotes);
                const resolvedSourceNote = !isNoiseValue(cleanedSourceNote)
                  ? cleanedSourceNote
                  : (cleanedFieldValues || cleanedThreshold || rules);

                if (!cleanedThreshold && !cleanedFieldValues && !rules) {
                  return null;
                }

                return {
                  ...field,
                  fieldName,
                  thresholdValue: cleanedThreshold,
                  fieldValues: cleanedFieldValues,
                  rules,
                  // Keep user-facing documentation close to actual policy text.
                  documentNotes: resolvedSourceNote.slice(0, 500),
                  orderIndex: Number.isFinite(Number(field.orderIndex)) ? Number(field.orderIndex) : fieldIndex,
                } as NormalizedField;
              })
              .filter(Boolean) as NormalizedField[];

            if (fields.length === 0) return null;

            return {
              ...subtab,
              name: cleanText(subtab.name),
              documentNotes: (() => {
                const note = cleanText(subtab.documentNotes);
                return isNoiseValue(note) ? "" : note.slice(0, 300);
              })(),
              orderIndex: Number.isFinite(Number(subtab.orderIndex)) ? Number(subtab.orderIndex) : subtabIndex,
              fields,
            } as NormalizedSubtab;
          })
          .filter(Boolean) as NormalizedSubtab[];

        if (subtabs.length === 0) return null;

        return {
          ...tab,
          name: cleanText(tab.name),
          documentNotes: (() => {
            const note = cleanText(tab.documentNotes);
            return isNoiseValue(note) ? "" : note.slice(0, 300);
          })(),
          orderIndex: Number.isFinite(Number(tab.orderIndex)) ? Number(tab.orderIndex) : tabIndex,
          subtabs,
        } as NormalizedTab;
      })
      .filter(Boolean) as NormalizedTab[];

    return normalized;
  };

  const getDetectedFieldCount = () =>
    detectedTabs.reduce((count, tab) => {
      const subtabCount = (tab.subtabs || []).reduce((sum, subtab) => sum + (subtab.fields || []).length, 0);
      return count + subtabCount;
    }, 0);

  const handleExtractPolicyDetails = async (selectedFile?: File | null) => {
    const fileToProcess = selectedFile || changesFile;
    if (!fileToProcess) {
      toast.error("Upload a policy file first");
      return;
    }

    setBusy(true);
    const loadingToast = toast.loading("Extracting policy details and fields...");
    try {
      const { tabs, extracted } = await extractEditableTabs(fileToProcess);
      const sanitizedTabs = sanitizeExtractedTabs(tabs);
      if (sanitizedTabs.length === 0) {
        throw new Error("No extractable fields were detected in this document");
      }
      const detectedFieldCount = sanitizedTabs.reduce((count, tab) => {
        const subtabCount = (tab.subtabs || []).reduce((sum, subtab) => sum + (subtab.fields || []).length, 0);
        return count + subtabCount;
      }, 0);

      const extractedPolicyName = String(
        extracted?.policy_name || extracted?.result?.policy_name || fileToProcess.name.replace(/\.[^.]+$/, "")
      ).trim();

      setDetectedTabs(sanitizedTabs);
      setExtractedResult(extracted);
      localStorage.setItem(
        "existingPolicyExtractionDraft",
        JSON.stringify({
          extracted,
          tabs: sanitizedTabs,
          fileName: fileToProcess.name,
          savedAt: new Date().toISOString(),
        })
      );
      if (!draftName.trim()) {
        setDraftName(extractedPolicyName);
      }
      if (!draftDescription.trim()) {
        setDraftDescription(`Imported from existing policy file ${fileToProcess.name}.`);
      }

      toast.success(`Detected ${tabs.length} tabs and ${detectedFieldCount} fields. Review details and click Next.`, {
        id: loadingToast,
      });
    } catch (error: any) {
      toast.error(String(error?.response?.data?.message || error?.message || "Field detection failed"), {
        id: loadingToast,
      });
    } finally {
      setBusy(false);
    }
  };

  const seedPolicyStructureFromNormalizedDraft = async (
    policyId: string,
    filename: string,
    tabs: NormalizedTab[],
  ) => {
    const cleanSeedNote = (value?: string) => {
      const note = String(value || "").replace(/\s+/g, " ").trim();
      if (!note) return "";
      const lower = note.toLowerCase();
      if (lower.includes("normalized from extraction output")) return "";
      if (lower.includes("auto-normalized from")) return "";
      if (lower.includes("source section:")) return "";
      if (lower.includes("imported from ")) return "";
      if (lower.includes("auto-generated from ")) return "";
      return note;
    };

    const validTabs = (tabs || []).filter((tab) => String(tab?.name || "").trim());
    if (validTabs.length === 0) return;

    for (let tabIndex = 0; tabIndex < validTabs.length; tabIndex += 1) {
      const tabDef = validTabs[tabIndex];
      const tabNotes = cleanSeedNote(tabDef.documentNotes);
      const tabName = String(tabDef.name || "").trim();
      if (!tabName) continue;
      const { data: tabRes } = await api.post("/tab/createTab", {
        name: tabName,
        policyEngineId: policyId,
        orderIndex: Number.isFinite(Number(tabDef.orderIndex)) ? Number(tabDef.orderIndex) : tabIndex,
        documentNotes: tabNotes.slice(0, 400),
      });

      const createdTab = unwrapApiData<any>(tabRes);
      const tabId = createdTab?.id;
      if (!tabId) throw new Error(`Failed to create normalized tab: ${tabName}`);

      const subtabs = Array.isArray(tabDef.subtabs) ? tabDef.subtabs : [];
      for (let subtabIndex = 0; subtabIndex < subtabs.length; subtabIndex += 1) {
        const subtabDef = subtabs[subtabIndex];
        const subtabNotes = cleanSeedNote(subtabDef.documentNotes);
        const subtabName = String(subtabDef.name || "").trim();
        if (!subtabName) continue;
        const { data: subtabRes } = await api.post("/subtab/create", {
          name: subtabName,
          orderIndex: Number.isFinite(Number(subtabDef.orderIndex)) ? Number(subtabDef.orderIndex) : subtabIndex,
          documentNotes: subtabNotes.slice(0, 400),
          displayMode: subtabDef.displayMode,
          tabId,
        });

        const createdSubtab = unwrapApiData<any>(subtabRes);
        const subTabId = createdSubtab?.id;
        if (!subTabId) throw new Error(`Failed to create normalized subtab: ${subtabName}`);

        const fields = Array.isArray(subtabDef.fields) ? subtabDef.fields : [];
        for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex += 1) {
          const fieldDef = fields[fieldIndex];
          const fieldName = String(fieldDef.fieldName || "").trim();
          if (!fieldName) continue;
          const sourceText = String(
            fieldDef.documentNotes || fieldDef.fieldValues || fieldDef.thresholdValue || fieldDef.rules || ""
          ).trim();
          const cleanedSourceText = cleanSeedNote(sourceText);

          await api.post("/field/create", {
            fieldName,
            fieldType: fieldDef.fieldType,
            operator: fieldDef.operator,
            thresholdValue: String(fieldDef.thresholdValue || "").slice(0, 500),
            fieldValues: String(fieldDef.fieldValues || "").slice(0, 500),
            rules: String(fieldDef.rules || "").slice(0, 250),
            documentNotes: cleanedSourceText.slice(0, 500),
            orderIndex: Number.isFinite(Number(fieldDef.orderIndex)) ? Number(fieldDef.orderIndex) : fieldIndex,
            subTabId,
          });
        }
      }
    }
  };

  const handleStartChangesFlow = async () => {
    if (!changesFile) {
      toast.error("Upload a policy file to continue");
      return;
    }

    if (detectedTabs.length === 0 || !extractedResult) {
      toast.error("Wait for extraction to complete, then click Next");
      return;
    }

    setBusy(true);
    const loadingToast = toast.loading("Preparing extracted draft and opening build page...");

    try {
      const effectiveName = draftName.trim() || changesFile.name.replace(/\.[^.]+$/, "");
      if (!effectiveName) {
        throw new Error("Policy name is required");
      }

      const { data: createdRaw } = await api.post("/policy/create", {
        name: effectiveName,
        product: draftProduct.trim() || "GENERAL",
        status: "DRAFT",
        version: draftVersion.trim() || "v1.0",
        description: draftDescription.trim() || `Imported from existing file: ${changesFile.name}`,
      });

      const created = unwrapApiData<PolicyCreateResponse>(createdRaw);
      const policyId = created.id;
      await seedPolicyStructureFromNormalizedDraft(policyId, changesFile.name, detectedTabs);
      try {
        localStorage.setItem(
          "existingPolicyDraftMeta",
          JSON.stringify({
            policyId,
            name: effectiveName,
            version: draftVersion.trim() || "v1.0",
            uploadedFileName: changesFile.name,
            extractedPolicyName: extractedResult.policy_name || extractedResult.result?.policy_name || "",
            savedAt: new Date().toISOString(),
          })
        );
      } catch {
        // ignore localStorage errors
      }

      if (postAction === "annexure") {
        await api.post("/policy/version", {
          policyId,
          versionNumber: `${draftVersion || "v1.0"}-annexure-${Date.now()}`,
          changeNote: changePrompt || "Annexure draft created after existing policy import",
        });
        toast.success("Editable draft created and annexure flow started", { id: loadingToast });
        router.push(`/dashboard/maker/${policyId}/build?mode=annexure&entry=existing`);
        return;
      }

      toast.success("Draft prepared from uploaded policy. Opening builder...", { id: loadingToast });
      router.push(`/dashboard/maker/${policyId}/build?entry=existing&assistant=chat`);
    } catch (error: any) {
      toast.error(String(error?.response?.data?.message || error?.message || "Failed to prepare editable draft"), {
        id: loadingToast,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateBreRules = async () => {
    if (!breFile) {
      toast.error("Upload a policy document first");
      return;
    }

    setBusy(true);
    const loadingToast = toast.loading("Extracting policy and generating BRE rules...");

    try {
      const result = await runExtractionUpload(breFile);
      setBreResult(result);
      toast.success("BRE rule generation input stored successfully", { id: loadingToast });
    } catch (error: any) {
      toast.error(String(error?.response?.data?.message || error?.message || "BRE rule generation failed"), {
        id: loadingToast,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-tight text-ink-900">Upload Existing Policy</h1>
          <p className="mt-1 text-sm text-ink-500">
            First-time flow: upload policy and either store it for BRE or convert it into editable tabs, subtabs, and fields.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/maker/create")}>Back to Create Policy</Button>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("changes")}
          className={`rounded-xl border p-5 text-left transition-all ${
            mode === "changes"
              ? "border-brand-500 bg-brand-50 shadow-sm"
              : "border-ink-200 bg-surface-card hover:border-ink-300"
          }`}
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <ArrowRightLeft className="h-4 w-4 text-brand-600" />
            Extract and Edit Policy
          </div>
          <p className="text-sm text-ink-500">
            Upload DOCX/PDF, auto-build draft UI from extraction, then continue with AI chat edits or annexure workflow.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("bre_rules")}
          className={`rounded-xl border p-5 text-left transition-all ${
            mode === "bre_rules"
              ? "border-brand-500 bg-brand-50 shadow-sm"
              : "border-ink-200 bg-surface-card hover:border-ink-300"
          }`}
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <DatabaseZap className="h-4 w-4 text-brand-600" />
            Upload for Data Lake / BRE Rules
          </div>
          <p className="text-sm text-ink-500">
            Upload existing document only for extraction and BRE-ready storage without creating a policy draft record.
          </p>
        </button>
      </section>

      {mode === "changes" && (
        <Card className="rounded-xl border-ink-200 shadow-sm">
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label>Policy Name</Label>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder={changesFile ? `e.g. ${changesFile.name.replace(/\.[^.]+$/, "")}` : "e.g. MSME Loan Policy"}
                />
              </div>
              <div className="space-y-2">
                <Label>Version</Label>
                <Input value={draftVersion} onChange={(e) => setDraftVersion(e.target.value)} placeholder="v1.0" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Product</Label>
                <Input
                  value={draftProduct}
                  onChange={(e) => setDraftProduct(e.target.value)}
                  placeholder="e.g. MSME, Personal Loan"
                />
              </div>
              <div className="space-y-2">
                <Label>Post-Extraction Action</Label>
                <Select value={postAction} onValueChange={(v: "ai_chat" | "annexure") => setPostAction(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai_chat">Open Builder with AI Chat Editing</SelectItem>
                    <SelectItem value="annexure">Create Annexure Snapshot and Open</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder="Short description for this imported policy draft"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Changes / Additions Prompt (Optional)</Label>
              <Textarea
                value={changePrompt}
                onChange={(e) => setChangePrompt(e.target.value)}
                placeholder="Describe the change scope, e.g. add DSCR threshold and revise collateral clause for MSME unsecured loans"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Existing Policy Document</Label>
              <input
                ref={changesFileRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setChangesFile(file);
                  setDetectedTabs([]);
                  setExtractedResult(null);
                  if (file && !draftName.trim()) {
                    setDraftName(file.name.replace(/\.[^.]+$/, ""));
                  }
                  if (file) {
                    void handleExtractPolicyDetails(file);
                  }
                }}
              />
              <div className="rounded-xl border-2 border-dashed border-ink-200 p-4 transition-colors hover:border-ink-300 hover:bg-surface-raised">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-ink-500">
                    {changesFile ? `Attached: ${changesFile.name}` : "Attach policy file to extract tabs/subtabs/fields"}
                  </p>
                  <Button type="button" variant="outline" onClick={() => changesFileRef.current?.click()}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {changesFile ? "Change File" : "Attach File"}
                  </Button>
                </div>
              </div>
            </div>

            {extractedResult && (
              <div className="rounded-xl border border-ink-200 bg-surface-raised p-4 space-y-2">
                <h3 className="text-sm font-semibold text-ink-900">Extracted Policy Details</h3>
                <div className="grid gap-2 text-xs text-ink-700 md:grid-cols-2">
                  <p><span className="font-semibold text-ink-900">Policy Name:</span> {extractedResult.policy_name || extractedResult.result?.policy_name || "N/A"}</p>
                  <p><span className="font-semibold text-ink-900">File:</span> {changesFile?.name || extractedResult.filename || "N/A"}</p>
                  <p><span className="font-semibold text-ink-900">LLM Provider:</span> {extractedResult.llm_provider || "azure-foundry"}</p>
                  <p><span className="font-semibold text-ink-900">Detected Tabs:</span> {detectedTabs.length}</p>
                  <p><span className="font-semibold text-ink-900">Detected Fields:</span> {getDetectedFieldCount()}</p>
                  <p><span className="font-semibold text-ink-900">Triples:</span> {extractedResult.stats?.total_triples ?? "N/A"}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => handleExtractPolicyDetails()} disabled={busy || !changesFile}>
                {busy ? "Extracting..." : "Re-extract Policy Details"}
              </Button>
              <Button onClick={handleStartChangesFlow} disabled={busy}>
                <FileStack className="mr-2 h-4 w-4" />
                {busy ? "Preparing..." : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === "bre_rules" && (
        <Card className="rounded-xl border-ink-200 shadow-sm">
          <CardContent className="space-y-4 pt-6">
            <div>
              <h2 className="text-xl font-semibold text-ink-900">Generate Rules for BRE</h2>
              <p className="mt-1 text-sm text-ink-500">
                Upload policy file, extract key clauses/rules, and store generated context for BRE pipeline.
              </p>
            </div>

            <input
              ref={breFileRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              className="hidden"
              onChange={(e) => setBreFile(e.target.files?.[0] || null)}
            />

            <div className="rounded-xl border-2 border-dashed border-ink-200 p-10 text-center transition-colors hover:border-ink-300 hover:bg-surface-raised">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised">
                <UploadCloud className="h-7 w-7 text-ink-300" />
              </div>
              <p className="mb-1 text-sm font-semibold text-ink-900">Drag & drop your policy file</p>
              <p className="mb-4 text-xs text-ink-500">DOCX or PDF · Max 25MB</p>
              <Button variant="outline" onClick={() => breFileRef.current?.click()}>
                Browse files
              </Button>
              {breFile && <p className="mt-3 text-xs text-ink-500">Selected: {breFile.name}</p>}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleGenerateBreRules} disabled={busy || !breFile}>
                {busy ? "Generating..." : "Generate BRE Rules"}
              </Button>
            </div>

            {breResult && (
              <div className="rounded-xl border border-ink-200 bg-surface-raised p-4 text-sm text-ink-700">
                <p>
                  <span className="font-semibold text-ink-900">Status:</span> {breResult.status || "completed"}
                </p>
                <p>
                  <span className="font-semibold text-ink-900">Policy Name:</span> {breResult.policy_name || breResult.result?.policy_name || "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-ink-900">Stored for BRE:</span>{" "}
                  {String(breResult.pinecone_db?.stored ?? breResult.result?.pinecone_db?.stored ?? "unknown")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
