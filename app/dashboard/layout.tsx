"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <SidebarProvider>
      <Toaster position="top-right" />
      <Sidebar user={user} />
      <SidebarInset className="bg-gray-50">
        <main className="h-screen overflow-y-auto bg-slate-50">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
