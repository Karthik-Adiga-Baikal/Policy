"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LayoutTemplate, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  PREDEFINED_POLICY_TEMPLATES,
  getPolicyTemplateStats,
} from "@/lib/policyTemplates";
import { useCheckers } from "@/hooks/useCheckers";

type CreatePolicyResponse = {
  id: string;
};

export default function CreateBlankPolicyPage() {
  const router = useRouter();
  const { data: checkers = [] } = useCheckers();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    product: "",
    description: "",
    version: "v1.0",
    status: "DRAFT",
    checkerId: "",
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState("blank");
  const selectedTemplate = PREDEFINED_POLICY_TEMPLATES.find(
    (t) => t.id === selectedTemplateId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Policy name is required");
      return;
    }

    if (!formData.product.trim()) {
      toast.error("Product is required");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/policy/create", {
        name: formData.name.trim(),
        product: formData.product.trim(),
        description: formData.description.trim() || undefined,
        version: formData.version,
        status: formData.status,
        checkerId: formData.checkerId || undefined,
      });

      const createdPolicy = data.data as CreatePolicyResponse;

      if (!createdPolicy?.id) {
        throw new Error("No policy ID returned");
      }

      // If template was selected (not blank), apply template structure
      if (selectedTemplateId !== "blank") {
        // Navigate to builder which will auto-apply template
        router.push(
          `/dashboard/maker/${createdPolicy.id}/build?template=${selectedTemplateId}`
        );
      } else {
        // Navigate directly to builder for blank policy
        router.push(`/dashboard/maker/${createdPolicy.id}/build`);
      }

      toast.success("Policy created successfully!");
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to create policy";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-10 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Create Policy</span>
                <span>›</span>
                <span className="text-slate-900 font-medium">Blank Policy</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Create New Policy</h1>
            </div>
          </div>
        </div>

        {/* Template Selection Card */}
        <Card className="mb-8 bg-white border-slate-200 rounded-2xl">
          <CardContent className="pt-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <LayoutTemplate className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Select Starting Template</h2>
              </div>
              <p className="text-slate-600 text-sm">
                Choose a predefined template to jumpstart your policy, or start from scratch.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Blank Option */}
              <div
                onClick={() => setSelectedTemplateId("blank")}
                className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                  selectedTemplateId === "blank"
                    ? "border-blue-600 bg-blue-50 shadow-md"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-slate-900">Blank Policy</h3>
                  {selectedTemplateId === "blank" && (
                    <Badge className="bg-blue-600 text-white">Selected</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  Start from scratch with a completely empty policy.
                </p>
              </div>

              {/* Template Options */}
              {PREDEFINED_POLICY_TEMPLATES.map((template) => {
                const stats = getPolicyTemplateStats(template);
                const isSelected = selectedTemplateId === template.id;

                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 shadow-md"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{template.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">{template.category}</p>
                      </div>
                      {isSelected && (
                        <Badge className="bg-blue-600 text-white flex-shrink-0">Selected</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{template.summary}</p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <div className="font-semibold text-slate-900">{stats.tabCount}</div>
                        <div className="text-slate-500">Tabs</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <div className="font-semibold text-slate-900">{stats.subtabCount}</div>
                        <div className="text-slate-500">Groups</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <div className="font-semibold text-slate-900">{stats.fieldCount}</div>
                        <div className="text-slate-500">Fields</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Policy Details Form */}
        <Card className="bg-white border-slate-200 rounded-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Policy Details</h2>
              </div>

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
                    placeholder={selectedTemplate?.product || "e.g., MSME Loan"}
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

              <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {loading ? "Creating..." : "Create & Open in Builder"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
