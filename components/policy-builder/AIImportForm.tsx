"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Sparkles, ArrowRight, Loader } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertCrewAIToBlocks } from "@/lib/convertToBlocks";
import { useCheckers } from "@/hooks/useCheckers";

interface AIImportedData {
  name?: string;
  product?: string;
  version?: string;
  description?: string;
  blocks?: any[];
}

interface AIImportFormProps {
  onSuccess?: (policyId: string) => void;
}

export default function AIImportForm({ onSuccess }: AIImportFormProps) {
  const router = useRouter();
  const { data: checkers = [] } = useCheckers();
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [aiData, setAiData] = useState<AIImportedData>({});

  const [formData, setFormData] = useState({
    name: "",
    product: "",
    description: "",
    version: "v1.0",
    status: "DRAFT",
    checkerId: "",
  });

  // Handle file upload and AI processing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formDataWithFile = new FormData();
      formDataWithFile.append("file", file);

      // Upload directly to extraction API
      const response = await fetch("http://localhost:8000/api/extraction-v2/upload", {
        method: "POST",
        body: formDataWithFile,
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Extraction failed: ${response.statusText}`);
      }

      const responseJson = await response.json();
      console.log("Raw extraction response:", responseJson);

      // Handle different response formats from extraction backend
      let extractedData = responseJson;

      // Check for nested data structures
      if (responseJson.data) {
        extractedData = responseJson.data;
      } else if (responseJson.result) {
        extractedData = responseJson.result;
      }

      console.log("Extracted data:", extractedData);

      // Pre-fill form with AI-extracted data
      // Handle nested policy_document structure
      const policyDoc = extractedData.policy_document || extractedData;

      setAiData(extractedData);
      setFormData({
        name: extractedData.policy_name || policyDoc.name || extractedData.name || "",
        product: extractedData.product || policyDoc.product || extractedData.policy_type || "",
        description: extractedData.description || policyDoc.description || extractedData.policy_description || "",
        version: extractedData.version || policyDoc.version || extractedData.policy_version || "v1.0",
        status: "DRAFT",
        checkerId: "",
      });
      console.log("Form data pre-filled from extraction:", { name: extractedData.policy_name || policyDoc.name, version: policyDoc.version });

      setStep("review");
      toast.success("Document processed successfully!");
    } catch (error: any) {
      const msg = error?.message || "Failed to process document";
      toast.error(msg);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  // Create policy with blocks
  const handleCreateWithBlocks = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Policy name is required");
      return;
    }

    if (!formData.product.trim()) {
      toast.error("Product is required");
      return;
    }

    setCreating(true);
    try {
      // Step 1: Create policy
      const { data: policyData } = await api.post("/policy/create", {
        name: formData.name.trim(),
        product: formData.product.trim(),
        description: formData.description.trim() || undefined,
        version: formData.version,
        status: formData.status,
        checkerId: formData.checkerId || undefined,
      });

      const createdPolicy = policyData.data as { id: string };

      if (!createdPolicy?.id) {
        throw new Error("No policy ID returned");
      }

      // Step 2: Create blocks from AI data if available
      console.log("AI Data for block creation:", aiData);

      if (aiData && Object.keys(aiData).length > 0) {
        try {
          const blocksToCreate = convertCrewAIToBlocks(aiData);
          console.log("Blocks to create:", blocksToCreate);

          if (blocksToCreate.length > 0) {
            const blockResponse = await api.post("/block/bulk-create", {
              policyId: createdPolicy.id,
              blocks: blocksToCreate,
            });
            console.log("Blocks created:", blockResponse.data);
            toast.success(`Created policy with ${blocksToCreate.length} blocks!`);
          } else {
            console.warn("No blocks converted from extraction data");
            toast.info("Policy created (no blocks extracted from document)");
          }
        } catch (blockError: any) {
          console.error("Error creating blocks:", blockError);
          toast.warn("Policy created but block import failed - you can add blocks manually");
        }
      } else {
        console.warn("No extraction data available");
        toast.info("Policy created - you can add blocks manually");
      }

      // Step 3: Redirect to builder
      router.push(`/dashboard/maker/${createdPolicy.id}/build`);

      if (onSuccess) {
        onSuccess(createdPolicy.id);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to create policy";
      toast.error(msg);
      console.error("Create error:", error);
    } finally {
      setCreating(false);
    }
  };

  if (step === "upload") {
    return (
      <Card className="bg-white border-slate-200 rounded-2xl">
        <CardContent className="pt-8 pb-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Import Policy from AI</h2>
                <p className="text-sm text-slate-500 mt-1">Upload a document and let AI extract policy details</p>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.json"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <Upload size={32} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {uploading ? "Processing..." : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX, TXT, or JSON (Max 10MB)</p>
                  </div>
                  {uploading && <Loader size={20} className="animate-spin text-blue-600" />}
                </div>
              </label>
            </div>

            <p className="text-xs text-slate-500 text-center">
              The AI will extract policy metadata, sections, and rules from your document
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-slate-200 rounded-2xl">
      <CardContent className="pt-8">
        <form onSubmit={handleCreateWithBlocks} className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Review & Confirm Policy Details</h2>
              <p className="text-sm text-slate-500">AI has extracted the following information from your document</p>
            </div>
          </div>

          {/* Extracted Data Summary */}
          {aiData && Object.keys(aiData).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-xs font-semibold text-blue-900 mb-3">AI-Extracted Data</p>
              <div className="text-sm text-blue-800 space-y-1">
                {aiData.blocks && Array.isArray(aiData.blocks) && (
                  <p>Found {aiData.blocks.length} blocks to import</p>
                )}
                {aiData.name && <p>Policy: {aiData.name}</p>}
                {aiData.product && <p>Product: {aiData.product}</p>}
              </div>
            </div>
          )}

          {/* Policy Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-semibold text-slate-700">
              Policy Name *
            </Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., MSME Loan Policy"
              className="border-slate-200"
            />
          </div>

          {/* Product & Version */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product" className="font-semibold text-slate-700">
                Product *
              </Label>
              <Input
                id="product"
                type="text"
                required
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                placeholder="e.g., MSME Loan"
                className="border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version" className="font-semibold text-slate-700">
                Version
              </Label>
              <Input
                id="version"
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="v1.0"
                className="border-slate-200"
              />
            </div>
          </div>

          {/* Status & Checker */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="font-semibold text-slate-700">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status" className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checker" className="font-semibold text-slate-700">
                Assign Checker (Optional)
              </Label>
              <Select
                value={formData.checkerId}
                onValueChange={(value) => setFormData({ ...formData, checkerId: value })}
              >
                <SelectTrigger id="checker" className="border-slate-200">
                  <SelectValue placeholder="Select checker..." />
                </SelectTrigger>
                <SelectContent>
                  {checkers.map((checker) => (
                    <SelectItem key={checker.id} value={checker.id}>
                      {checker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold text-slate-700">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the purpose and scope of this policy..."
              rows={4}
              className="border-slate-200"
            />
          </div>

          {/* Buttons */}
          <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("upload")}
              disabled={creating}
              className="border-slate-300"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {creating ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create & Open Builder
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
