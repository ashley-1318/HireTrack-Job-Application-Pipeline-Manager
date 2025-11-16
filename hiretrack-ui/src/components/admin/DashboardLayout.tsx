import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { getMe, clearToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [authed, setAuthed] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    getMe()
      .then(() => { if (active) setAuthed(true); })
      .catch(() => { if (active) { setAuthed(false); navigate('/admin/login'); } });
    return () => { active = false; };
  }, [navigate]);

  if (!authed) return null;
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={() => { clearToken(); navigate('/admin/login'); }}>Logout</Button>
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
