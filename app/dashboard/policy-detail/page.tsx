"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Search } from "lucide-react";

interface Policy {
  id: string;
  name: string;
  status: string;
  product: string;
  version: string;
  description?: string;
  startDate?: string;
  maker?: { name: string };
  checker?: { name: string };
}

export default function PolicyDetailPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: policies = [] } = useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const { data } = await api.get("/policy/getAll");
      return (data.data || []) as Policy[];
    },
  });

  const categories = useMemo(() => {
    const cats = new Set(policies.map((p) => p.product));
    return Array.from(cats).sort() as string[];
  }, [policies]);

  const statuses = useMemo(() => {
    const stats = new Set(policies.map((p) => p.status));
    return Array.from(stats).sort() as string[];
  }, [policies]);

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === "all" || p.product === selectedCategory;
      const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [policies, searchTerm, selectedCategory, selectedStatus]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Policy Detail</h1>
          </div>
          <p className="text-slate-600 text-lg">
            Search, filter, and review all governed NBFC policies before opening them in Policy Studio or the detailed view.
          </p>
        </div>

        {/* Intro Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Browse Policies</h2>
          <p className="text-slate-600">
            Browse all governed policies, filter by category, and open the item in Policy Studio or the detailed view.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              {filtered.length} policies
            </h3>
            <Button
              onClick={() => router.push("/dashboard/maker/create")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              + Add New Policy
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search policies
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by policy name, code, owner, or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {statuses.map((stat) => (
                      <SelectItem key={stat} value={stat}>
                        {stat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Cards Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">No policies found. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {filtered.map((policy) => (
              <div
                key={policy.id}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{policy.name}</h3>
                    <p className="text-sm text-slate-500">{policy.id.slice(0, 8)}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      policy.status === "PUBLISHED"
                        ? "bg-emerald-100 text-emerald-700"
                        : policy.status === "DRAFT"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {policy.status}
                  </span>
                </div>

                {policy.description && (
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {policy.description}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-slate-500 text-xs font-medium">Owner</p>
                    <p className="text-slate-900 font-semibold">{policy.maker?.name || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-slate-500 text-xs font-medium">Last Version</p>
                    <p className="text-slate-900 font-semibold">{policy.version || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-slate-500 text-xs font-medium">Product</p>
                    <p className="text-slate-900 font-semibold">{policy.product}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push(`/dashboard/maker/${policy.id}/build`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Open In Policy Studio
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/policy/${policy.id}`)}
                    className="flex-1 border-slate-300"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
