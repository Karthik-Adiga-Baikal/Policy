"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { logout, type AuthUser } from "@/store/slices/authSlice";
import { LayoutDashboard, FilePlus, ClipboardList, Database, History, ShieldCheck, ScrollText, FlaskConical, LogOut, User as UserIcon, ChevronsUpDown, ChevronRight } from "lucide-react";
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

  const menuItems = [
    { name: "Overview", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Versions", href: "/dashboard/versions", icon: <History size={18} /> },
    { name: "Audit Log", href: "/dashboard/audit-log", icon: <ScrollText size={18} /> },
    { name: "Simulation", href: "/dashboard/simulation", icon: <FlaskConical size={18} /> },
    ...(isMaker
      ? [
          { name: "My Policies", href: "/dashboard/maker", icon: <Database size={18} /> },
          { name: "Create Policy", href: "/dashboard/maker/create", icon: <FilePlus size={18} /> },
        ] 
      : []),
    ...(isChecker
      ? [
          { name: "Approval Queue", href: "/dashboard/checker/queue", icon: <ClipboardList size={18} /> },
        ] 
      : []),
    ...(isAdmin ? [{ name: "Admin", href: "/dashboard/admin", icon: <ShieldCheck size={18} /> }] : []),
  ];

  return (
    <AppShellSidebar
      collapsible="icon"
      className="bg-white text-slate-900 border-r border-slate-200 shadow-sm [--sidebar:#ffffff] [--sidebar-foreground:#0f172a] [--sidebar-primary:#0f172a] [--sidebar-primary-foreground:#ffffff] [--sidebar-accent:#f1f5f9] [--sidebar-accent-foreground:#0f172a] [--sidebar-border:#e2e8f0]"
    >
      <div className={`h-14 border-b border-sidebar-border px-3 flex items-center ${open ? "justify-between" : "justify-center"} gap-2`}>
        {open ? (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-sidebar-foreground truncate">Policy Manager</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 truncate">Enterprise</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <SidebarTrigger className="h-7 w-7 rounded-md hover:bg-slate-100" />
              <ChevronsUpDown size={16} className="text-sidebar-foreground" />
            </div>
          </>
        ) : (
          <SidebarTrigger className="h-8 w-8 rounded-md hover:bg-slate-100" />
        )}
      </div>

      {open && (
        <div className="px-3 pt-3 text-xs uppercase tracking-wide font-semibold text-sidebar-foreground/80">Platform</div>
      )}
      
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.name}
            className={`flex items-center ${open ? "justify-between" : "justify-center"} gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === item.href 
                ? "bg-indigo-50 text-indigo-600" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <div className={`flex items-center gap-3 min-w-0 ${open ? "" : "w-full justify-center"}`}>
              <span className={pathname === item.href ? "text-indigo-600" : "text-slate-400"}>{item.icon}</span>
              {open && <span className="truncate">{item.name}</span>}
            </div>
            {open && <ChevronRight size={14} className="text-slate-300" />}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div
          className={`mb-2 border border-sidebar-border ${open ? "bg-sidebar-accent rounded-lg p-3" : "bg-transparent border-0 p-0 flex justify-center"}`}
        >
          <div className={`flex items-center ${open ? "justify-between w-full" : "justify-center"} gap-2`}>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-600 flex items-center justify-center text-white">
              <UserIcon size={22} />
            </div>
            {open && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || "User"}</p>
                <Badge variant="secondary" className="text-[10px] mt-1 bg-sidebar-primary text-sidebar-primary-foreground border-0">{role || "USER"}</Badge>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          className={`w-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 ${open ? "justify-start" : "justify-center rounded-lg h-10 w-10 mx-auto"}`}
          title="Logout"
          onClick={() => dispatch(logout())}
        >
          <LogOut size={18} />
          {open && <span className="ml-2">Logout</span>}
        </Button>

        {open && (
          <p className="mt-2 text-[11px] text-sidebar-foreground/80">
            Role: <span className="font-semibold text-sidebar-foreground">{role || "USER"}</span>
          </p>
        )}
      </div>
    </AppShellSidebar>
  );
}
