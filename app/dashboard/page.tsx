"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  FileText,
  Layers,
  Zap,
  ChevronRight,
  Activity,
  CheckCircle,
  Clock,
  Eye,
  Edit2,
  Plus,
} from "lucide-react";
import { usePolicyStats } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

interface AuditLog {
  id: string;
  action: string;
  changes: string;
  userName?: string;
  createdAt: string;
  policyId?: string;
  policyName?: string;
}

export default function ExecutiveDashboard() {
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = usePolicyStats();

  // Fetch user policies - uses /policy/getAll which filters by current user on backend
  const { data: userPolicies = [], isLoading: policiesLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const { data } = await api.get("/policy/getAll");
      return data.data || [];
    },
  });

  // Fetch all policies for governance metrics
  const { data: allPolicies = [] } = useQuery({
    queryKey: ["all-policies"],
    queryFn: async () => {
      const { data } = await api.get("/policy/getAll");
      return data.data || [];
    },
  });

  // Fetch recent audit logs
  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data } = await api.get("/policy/audit");
      const logs = (data.data || []).slice(0, 5);

      // Enrich logs with policy names
      return logs.map((log: any) => {
        const policy = allPolicies.find((p: any) => p.id === log.policyId);
        return {
          ...log,
          policyName: policy?.name || "Unknown Policy",
        };
      });
    },
  });

  // Count policies by status
  const approvedCount = allPolicies.filter(
    (p: any) => p.status === "APPROVED"
  ).length;

  // Format relative time
  const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
        };
      case "DRAFT":
        return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
      case "IN_REVIEW":
      case "UNDER_REVIEW":
        return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
      case "APPROVED":
        return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" };
      case "PENDING_REVIEW":
        return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
      default:
        return { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };
    }
  };

  // Get action style for audit logs
  const getActionStyle = (action: string) => {
    switch (action) {
      case "CREATED":
        return { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" };
      case "UPDATED":
        return { icon: Activity, color: "text-blue-600", bg: "bg-blue-50" };
      case "PUBLISHED":
        return { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" };
      default:
        return { icon: Activity, color: "text-slate-600", bg: "bg-slate-50" };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto px-10 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <span>Policy Management Platform</span>
              <ChevronRight size={16} />
              <span className="text-slate-900 font-medium">Executive Dashboard</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              Executive Dashboard
            </h1>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200">
              AI Assisted
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
              Audit Ready
            </Badge>
          </div>
        </div>

        {/* Hero Section + Governance Posture */}
        <div className="grid grid-cols-3 gap-8">
          {/* Hero Section */}
          <div className="col-span-2">
            <Card className="bg-white border-slate-200">
              <CardContent className="p-8 space-y-6">
                <div>
                  <p className="text-sm font-medium text-indigo-600 mb-2">
                    Enterprise Policy Management Platform
                  </p>
                  <h2 className="text-3xl font-bold text-slate-900 leading-snug">
                    Design, govern, and publish enterprise policies end to end.
                  </h2>
                  <p className="text-slate-600 mt-4 leading-relaxed">
                    This platform is structured for maker-checker policy creation,
                    AI-assisted policy building, multi-level approval workflows,
                    version history, and controlled publishing across business units.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => router.push("/dashboard/maker/create")}
                  >
                    Create Policy
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/maker/create/existing")}
                  >
                    Import Existing
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/audit-log")}
                  >
                    View Audit Log
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Governance Posture */}
          <div>
            <Card className="bg-white border-slate-200 h-full">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    Governance Posture
                  </h3>
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Healthy
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Policies in Draft</span>
                    <span className="text-xl font-bold text-slate-900">
                      {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.draft || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Under Review</span>
                    <span className="text-xl font-bold text-slate-900">
                      {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.inReview || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Approved</span>
                    <span className="text-xl font-bold text-slate-900">
                      {statsLoading ? <Skeleton className="h-6 w-8" /> : approvedCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Published</span>
                    <span className="text-xl font-bold text-slate-900">
                      {statsLoading ? <Skeleton className="h-6 w-8" /> : stats?.published || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Avg Review SLA</span>
                    <span className="text-xl font-bold text-slate-900">2.4 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Operating Model + AI Capabilities + Recent Activity */}
        <div className="grid grid-cols-3 gap-8">
          {/* Operating Model */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers size={20} className="text-indigo-600" />
                Operating Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm mb-2">
                  Maker Layer
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Business policy authors structure and draft policy documents
                  using the Policy Builder Studio. AI assists with clause
                  decomposition and field mapping.
                </p>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-semibold text-slate-900 text-sm mb-2">
                  Checker Layer
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Designated reviewers assess, annotate, approve, or request
                  revisions through the structured Approval Queue.
                </p>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-semibold text-slate-900 text-sm mb-2">
                  Admin Layer
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Platform administrators manage user roles, approval workflows,
                  audit trails, and publishing controls.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap size={20} className="text-indigo-600" />
                AI Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                    1
                  </span>
                  <h4 className="font-semibold text-slate-900 text-sm">
                    Policy Studio
                  </h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed ml-8">
                  Create structured policies with AI-assisted tab/subtab
                  decomposition and field mapping.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                    2
                  </span>
                  <h4 className="font-semibold text-slate-900 text-sm">
                    Document Analysis
                  </h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed ml-8">
                  Upload existing SOP documents or policy PDFs for AI-powered extraction and
                  auto-structuring.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                    3
                  </span>
                  <h4 className="font-semibold text-slate-900 text-sm">
                    Simulation & Testing
                  </h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed ml-8">
                  Run policy logic against real-world scenarios before
                  publishing to production.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} className="text-indigo-600" />
                Recent Activity
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/audit-log")}
                className="text-indigo-600 hover:text-indigo-700"
              >
                View all
                <ChevronRight size={14} className="ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log: any) => {
                    const { icon: Icon, color, bg } = getActionStyle(log.action);
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-b-0"
                      >
                        <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>
                          <Icon size={14} className={color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {log.policyName}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {log.action} by {log.userName || "Unknown"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatRelativeTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Your Policies Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Your Policies
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {policiesLoading ? "Loading..." : `${userPolicies.length} policies created by you`}
              </p>
            </div>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => router.push("/dashboard/maker/create")}
            >
              <Plus size={16} className="mr-2" />
              Create New Policy
            </Button>
          </div>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-0">
              {policiesLoading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </div>
              ) : userPolicies.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 mb-4">No policies created yet</p>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => router.push("/dashboard/maker/create")}
                  >
                    <Plus size={16} className="mr-2" />
                    Create your first policy
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200">
                      <TableHead className="text-left font-semibold text-slate-900">
                        Policy Name
                      </TableHead>
                      <TableHead className="text-left font-semibold text-slate-900">
                        Product
                      </TableHead>
                      <TableHead className="text-left font-semibold text-slate-900">
                        Status
                      </TableHead>
                      <TableHead className="text-left font-semibold text-slate-900">
                        Version
                      </TableHead>
                      <TableHead className="text-left font-semibold text-slate-900">
                        Last Modified
                      </TableHead>
                      <TableHead className="text-left font-semibold text-slate-900">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userPolicies.map((policy: any) => {
                      const statusStyle = getStatusBadge(policy.status);
                      return (
                        <TableRow key={policy.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <TableCell className="py-4">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {policy.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                ID: {policy.id.slice(0, 8)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {policy.product || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border} rounded-full`}
                            >
                              {policy.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {policy.version || "1.0"}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {new Date(policy.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-600 hover:text-indigo-600"
                                onClick={() =>
                                  router.push(`/dashboard/policy/${policy.id}`)
                                }
                                title="View"
                              >
                                <Eye size={16} />
                              </Button>
                              {(policy.status === "DRAFT" ||
                                policy.status === "CHANGES_REQUESTED") && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-slate-600 hover:text-indigo-600"
                                  onClick={() =>
                                    router.push(`/dashboard/maker/${policy.id}`)
                                  }
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
