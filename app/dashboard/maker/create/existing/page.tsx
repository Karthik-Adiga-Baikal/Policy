"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AIImportForm from "@/components/policy-builder/AIImportForm";

export default function ImportExistingPolicyPage() {
  const router = useRouter();

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
                <span className="text-slate-900 font-medium">Import Existing Policy</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Import Policy from Document</h1>
            </div>
          </div>
        </div>

        {/* AI Import Form - handles upload and block creation */}
        <AIImportForm
          onSuccess={(policyId) => {
            // Optional callback if needed
          }}
        />
      </div>
    </div>
  );
}
