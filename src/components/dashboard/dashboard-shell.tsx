"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Cloud,
  Truck,
  FileText,
  ShieldCheck,
  Lightbulb,
  MessageSquare,
  Bell,
  Upload,
  Settings,
  RefreshCw,
  User,
  Search,
} from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DashboardTab =
  | "overview"
  | "emissions"
  | "suppliers"
  | "reports"
  | "csrd"
  | "insights"
  | "chat";

const tabs: { id: DashboardTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "emissions", label: "Emissions", icon: Cloud },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "csrd", label: "CSRD Status", icon: ShieldCheck },
  { id: "insights", label: "AI Insights", icon: Lightbulb },
  { id: "chat", label: "Qlim AI", icon: MessageSquare },
];

interface DashboardShellProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  children: React.ReactNode;
}

export function DashboardShell({ activeTab, onTabChange, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-[#f8f9fb]">
      <aside className="fixed left-0 top-0 z-40 flex h-full w-[17rem] flex-col border-r border-border bg-white">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-brand/10 text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl border border-brand/20 bg-brand/5"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <Icon className={cn("relative h-4 w-4", active && "text-brand-dark")} />
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <Link href="/" className="text-xs font-medium text-muted-foreground transition-colors hover:text-brand-dark">
            ← Back to website
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-[17rem]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <Select defaultValue="nordic">
            <SelectTrigger className="h-9 w-52 rounded-full border-border/60 bg-muted/30 text-sm">
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nordic">Nordic Manufacturing Group</SelectItem>
              <SelectItem value="nordic-de">Nordic DE Subsidiary</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="2024">
            <SelectTrigger className="h-9 w-28 rounded-full border-border/60 bg-muted/30 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">FY 2024</SelectItem>
              <SelectItem value="2023">FY 2023</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative hidden max-w-xs flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search data..." className="h-9 rounded-full border-border/60 bg-muted/30 pl-9 text-sm" />
          </div>
          <Button variant="ghost" size="icon" className="rounded-full"><RefreshCw className="h-4 w-4" /></Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
            </Button>
            <Button variant="outline" size="sm" className="hidden rounded-full sm:inline-flex">
              <Upload className="mr-2 h-4 w-4" />Upload
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full"><Settings className="h-4 w-4" /></Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand shadow-glow-sm">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
