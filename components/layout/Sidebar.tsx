"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { logout, type AuthUser } from "@/store/slices/authSlice";
import { LayoutDashboard, FilePlus, ClipboardList, Database, History, ShieldCheck, ScrollText, FlaskConical, LogOut, User as UserIcon, ChevronsUpDown, ChevronRight, Zap, FileText } from "lucide-react";
import { Sidebar as AppShellSidebar, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Sidebar({ user }: { user: AuthUser | null }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { open } = useSidebar();
  const role = String(user?.role || "").toUpperCase();
  const isMaker = role === "MAKER";
  const isChecker = role === "CHECKER";
  const isAdmin = role === "ADMIN" || role === "IT_ADMIN";

  const coreMenuItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, badge: "new", color: "from-indigo-500 to-indigo-600" },
    { name: "Policy Detail", href: "/dashboard/policy-detail", icon: FileText, color: "from-cyan-500 to-cyan-600" },
    { name: "Versions", href: "/dashboard/versions", icon: History, color: "from-slate-500 to-slate-600" },
    { name: "Audit Log", href: "/dashboard/audit-log", icon: ScrollText, color: "from-blue-500 to-blue-600" },
    { name: "Simulation", href: "/dashboard/simulation", icon: FlaskConical, color: "from-purple-500 to-purple-600" },
  ];

  const makerMenuItems = isMaker ? [
    { name: "My Policies", href: "/dashboard/maker", icon: Database, color: "from-amber-500 to-amber-600" },
    { name: "Create Policy", href: "/dashboard/maker/create", icon: FilePlus, color: "from-emerald-500 to-emerald-600", badge: "pro" },
  ] : [];

  const checkerMenuItems = isChecker ? [
    { name: "Approval Queue", href: "/dashboard/checker/queue", icon: ClipboardList, color: "from-rose-500 to-rose-600", badge: "priority" },
  ] : [];

  const adminMenuItems = isAdmin ? [
    { name: "Admin Panel", href: "/dashboard/admin", icon: ShieldCheck, color: "from-red-500 to-red-600" },
  ] : [];

  const allMenuItems = [...coreMenuItems, ...makerMenuItems, ...checkerMenuItems, ...adminMenuItems];

  return (
    <AppShellSidebar
      collapsible="icon"
      className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-r border-slate-800/50 shadow-2xl [--sidebar:#0f172a] [--sidebar-foreground:#f1f5f9] [--sidebar-primary:#6366f1] [--sidebar-primary-foreground:#ffffff] [--sidebar-accent:#1e293b] [--sidebar-accent-foreground:#cbd5e1] [--sidebar-border:#1e293b]"
    >
      {/* Header */}
      <div className={`h-16 border-b border-slate-800/50 px-3 flex items-center ${open ? "justify-between" : "justify-center"} gap-2 bg-gradient-to-r from-slate-800/50 to-transparent`}>
        {open ? (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                <ShieldCheck size={20} className="drop-shadow-lg" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">Policy Manager</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 truncate">v1.0 Enterprise</p>
              </div>
            </div>
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-slate-700/50 transition-colors" />
          </>
        ) : (
          <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-slate-700/50 transition-colors" />
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto scrollbar-hide">
        {/* Core Section */}
        {open && (
          <div>
            <div className="px-3 text-xs uppercase tracking-widest font-bold text-slate-500 mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
              Core
            </div>
            <div className="space-y-1">
              {coreMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    {!isActive && <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-indigo-600/0 to-indigo-600/0 group-hover:from-slate-700/50 group-hover:via-slate-700/25 transition-all" />}
                    <div className="relative flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg transition-all ${isActive ? "bg-white/20" : "bg-slate-700/40 group-hover:bg-slate-700"}`}>
                        <Icon size={18} />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isActive && <ChevronRight size={16} className="flex-shrink-0" />}
                    {item.badge && (
                      <Badge className="text-[9px] px-1.5 py-0 ml-auto flex-shrink-0 bg-indigo-400/20 text-indigo-200 border-indigo-400/40">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Maker Section */}
        {makerMenuItems.length > 0 && (
          <div>
            {open && (
              <p className="px-3 text-xs uppercase tracking-widest font-bold text-slate-500 mb-3 flex items-center gap-2">
                <Zap size={12} />
                <span>Maker</span>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
              </p>
            )}
            <div className="space-y-1">
              {makerMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    {!isActive && <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 via-emerald-600/0 to-emerald-600/0 group-hover:from-slate-700/50 group-hover:via-slate-700/25 transition-all" />}
                    <div className="relative flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg transition-all ${isActive ? "bg-white/20" : "bg-slate-700/40 group-hover:bg-slate-700"}`}>
                        <Icon size={18} />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isActive && <ChevronRight size={16} className="flex-shrink-0" />}
                    {item.badge && (
                      <Badge className="text-[9px] px-1.5 py-0 ml-auto flex-shrink-0 bg-emerald-400/20 text-emerald-200 border-emerald-400/40">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Checker Section */}
        {checkerMenuItems.length > 0 && (
          <div>
            {open && (
              <p className="px-3 text-xs uppercase tracking-widest font-bold text-slate-500 mb-3 flex items-center gap-2">
                <FileText size={12} />
                <span>Checker</span>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
              </p>
            )}
            <div className="space-y-1">
              {checkerMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-500/20"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    {!isActive && <div className="absolute inset-0 bg-gradient-to-r from-rose-600/0 via-rose-600/0 to-rose-600/0 group-hover:from-slate-700/50 group-hover:via-slate-700/25 transition-all" />}
                    <div className="relative flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg transition-all ${isActive ? "bg-white/20" : "bg-slate-700/40 group-hover:bg-slate-700"}`}>
                        <Icon size={18} />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isActive && <ChevronRight size={16} className="flex-shrink-0" />}
                    {item.badge && (
                      <Badge className="text-[9px] px-1.5 py-0 ml-auto flex-shrink-0 bg-rose-400/20 text-rose-200 border-rose-400/40 animate-pulse">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin Section */}
        {adminMenuItems.length > 0 && (
          <div>
            {open && (
              <p className="px-3 text-xs uppercase tracking-widest font-bold text-slate-500 mb-3 flex items-center gap-2">
                <ShieldCheck size={12} />
                <span>Admin</span>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
              </p>
            )}
            <div className="space-y-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    {!isActive && <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/0 to-red-600/0 group-hover:from-slate-700/50 group-hover:via-slate-700/25 transition-all" />}
                    <div className="relative flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg transition-all ${isActive ? "bg-white/20" : "bg-slate-700/40 group-hover:bg-slate-700"}`}>
                        <Icon size={18} />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isActive && <ChevronRight size={16} className="flex-shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-slate-800/50 bg-gradient-to-r from-slate-800/50 to-transparent space-y-3">
        <div className={`rounded-xl p-3 border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 transition-all hover:border-slate-600/50`}>
          <div className={`flex items-center ${open ? "gap-3" : "justify-center"}`}>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg ring-2 ring-slate-700/50">
              <UserIcon size={20} />
            </div>
            {open && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user?.name || "User"}</p>
                <Badge className="text-[10px] mt-1 bg-indigo-500/30 text-indigo-200 border-indigo-400/50 font-medium">
                  {role || "USER"}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          className={`w-full transition-all text-slate-400 hover:text-white hover:bg-slate-700/50 ${open ? "justify-start" : "justify-center h-10 w-10 p-0 mx-auto"}`}
          title="Logout"
          onClick={() => dispatch(logout())}
        >
          <LogOut size={18} />
          {open && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </AppShellSidebar>
  );
}
