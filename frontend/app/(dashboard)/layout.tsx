import { Suspense } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-150">
      {/* Left Navigation Sidebar wrapped in Suspense */}
      <Suspense fallback={<div className="w-64 h-screen bg-white dark:bg-zinc-950 border-r border-slate-50 dark:border-zinc-900/50" />}>
        <DashboardSidebar />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col relative transition-colors duration-150 bg-slate-50 dark:bg-zinc-950">
        {/* Sticky Header Bar */}
        <DashboardHeader />

        {/* Dynamic Page Content Viewport */}
        <main className="flex-grow p-8 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
