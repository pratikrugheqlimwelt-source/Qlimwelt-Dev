"use client";

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
} from "recharts";
import { AlertTriangle, TrendingDown, Download, Send, Bot, User } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  dashboardKpis, monthlyEmissions, departmentEmissions, scopeBreakdown, aiChips,
  topEmissionSources, renewableMix, carbonCostTrend, dashboardSuppliers,
  dashboardReports, csrdChecklist, aiRecommendations, qlimAiMessages,
} from "@/data/dashboard-data";
import { formatCO2, formatCurrency } from "@/lib/utils";
import { Cloud, Factory, Zap, Truck, Award, Euro, ShieldCheck, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function OverviewTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 border border-amber-200/80 bg-amber-50 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-amber-100">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-sm font-medium text-amber-900">3 supplier data requests overdue</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Emissions" value={dashboardKpis.totalEmissions} format="co2" change={dashboardKpis.totalChange} icon={Cloud} />
        <KpiCard title="Scope 1" value={dashboardKpis.scope1} format="co2" icon={Factory} />
        <KpiCard title="Scope 2" value={dashboardKpis.scope2} format="co2" icon={Zap} />
        <KpiCard title="Scope 3" value={dashboardKpis.scope3} format="co2" icon={Truck} />
        <KpiCard title="ESG Score" value={dashboardKpis.esgScore} format="score" icon={Award} />
        <KpiCard title="Carbon Cost Exposure" value={formatCurrency(dashboardKpis.carbonCostExposure)} format="text" icon={Euro} />
        <KpiCard title="CSRD Readiness" value={`${dashboardKpis.csrdReadiness}%`} format="text" icon={ShieldCheck} />
        <KpiCard title={`Reduction vs Target (${dashboardKpis.reductionTargetYear})`} value={`${dashboardKpis.reductionVsTarget}%`} format="text" icon={Target} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-lg font-semibold tracking-tight">Monthly Emissions Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyEmissions}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
                  <Area type="monotone" dataKey="scope1" stackId="1" stroke="#1e293b" fill="#1e293b" fillOpacity={0.7} name="Scope 1" />
                  <Area type="monotone" dataKey="scope2" stackId="1" stroke="#82E05C" fill="#82E05C" fillOpacity={0.7} name="Scope 2" />
                  <Area type="monotone" dataKey="scope3" stackId="1" stroke="#5cb832" fill="#5cb832" fillOpacity={0.5} name="Scope 3" />
                  <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" name="Target" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Scope Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={scopeBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {scopeBreakdown.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCO2(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Emissions by Department</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentEmissions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="dept" type="category" width={100} /><Tooltip /><Legend />
                <Bar dataKey="scope1" stackId="a" fill="#2563eb" name="Scope 1" />
                <Bar dataKey="scope2" stackId="a" fill="#16a34a" name="Scope 2" />
                <Bar dataKey="scope3" stackId="a" fill="#9333ea" name="Scope 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        {aiChips.map((chip) => (
          <Badge key={chip} variant="secondary" className="px-3 py-1.5 text-xs">{chip}</Badge>
        ))}
      </div>
    </div>
  );
}

export function EmissionsTab() {
  const total = dashboardKpis.totalEmissions;
  const scopes = [
    { name: "Scope 1", value: dashboardKpis.scope1, pct: Math.round((dashboardKpis.scope1 / total) * 100) },
    { name: "Scope 2", value: dashboardKpis.scope2, pct: Math.round((dashboardKpis.scope2 / total) * 100) },
    { name: "Scope 3", value: dashboardKpis.scope3, pct: Math.round((dashboardKpis.scope3 / total) * 100) },
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {scopes.map((s) => (
          <Card key={s.name}>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{s.name}</p>
              <p className="mt-2 text-2xl font-bold">{formatCO2(s.value)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.pct}% of total</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Emission Sources</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEmissionSources}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="source" /><YAxis /><Tooltip />
                  <Bar dataKey="emissions" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Renewable Energy Mix</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={renewableMix} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                    {renewableMix.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-center text-sm text-muted-foreground">Target: 100% renewable by 2027</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Carbon Cost Trend
            <Badge variant="warning">EU ETS risk rising +30% by 2027</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={carbonCostTrend}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis tickFormatter={(v) => `€${v}k`} />
                <Tooltip formatter={(v: number) => [`€${v}k`, "Exposure"]} />
                <Line type="monotone" dataKey="cost" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SuppliersTab() {
  const riskCounts = { high: 2, medium: 2, low: 2 };
  return (
    <div className="space-y-5">
      <div className="flex gap-4">
        <Badge variant="destructive">{riskCounts.high} High Risk</Badge>
        <Badge variant="warning">{riskCounts.medium} Medium Risk</Badge>
        <Badge variant="success">{riskCounts.low} Low Risk</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle>Supplier Risk Leaderboard</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Supplier</th>
                  <th className="pb-3 font-medium">Country</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Scope 3 tCO₂e</th>
                  <th className="pb-3 font-medium">Risk Score</th>
                  <th className="pb-3 font-medium">SBTi</th>
                  <th className="pb-3 font-medium">Disclosure</th>
                  <th className="pb-3 font-medium">Trend</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {dashboardSuppliers.map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="py-3 font-medium">{s.name}</td>
                    <td className="py-3">{s.country}</td>
                    <td className="py-3"><Badge variant="secondary">{s.category}</Badge></td>
                    <td className="py-3">{s.scope3.toLocaleString()}</td>
                    <td className="py-3">
                      <Badge variant={s.risk === "high" ? "destructive" : s.risk === "medium" ? "warning" : "success"}>{s.riskScore}</Badge>
                    </td>
                    <td className="py-3">{s.sbti}</td>
                    <td className="py-3">{s.disclosure}</td>
                    <td className="py-3">{s.trend > 0 ? "+" : ""}{s.trend}%</td>
                    <td className="py-3">
                      <Button variant="outline" size="sm" onClick={() => toast({ title: "Data request sent", description: `Request sent to ${s.name}` })}>
                        Request data
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportsTab() {
  return (
    <Card>
      <CardHeader><CardTitle>Downloadable Reports</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dashboardReports.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{r.name}</p>
                <Badge variant={r.status === "Ready" ? "success" : "warning"} className="mt-1">{r.status}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Download started", description: r.name })}>
                <Download className="mr-2 h-4 w-4" />{r.format}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CsrdTab() {
  return (
    <Card>
      <CardHeader><CardTitle>CSRD Progress Checklist</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {csrdChecklist.map((item) => (
          <div key={item.name}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span>{item.progress}%</span>
            </div>
            <Progress value={item.progress} className="h-3" indicatorClassName={item.progress >= 90 ? "bg-accent" : item.progress >= 60 ? "bg-primary" : "bg-warning"} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function InsightsTab() {
  return (
    <div className="space-y-4">
      {aiRecommendations.map((rec) => (
        <Card key={rec.id}>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{rec.title}</p>
                <Badge variant={rec.priority === "high" ? "destructive" : "warning"}>{rec.priority}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                −{rec.saving.toLocaleString()} tCO₂e · {formatCurrency(rec.cost)} · ROI: {rec.roi}
              </p>
            </div>
            <Button variant="outline">View details</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function QlimAiTab() {
  const [messages, setMessages] = useState(qlimAiMessages);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user" as const, content: input }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant" as const, content: "Based on your current emissions data, I can help analyse that. Would you like me to model a specific scenario or generate a report?" }]);
    }, 1000);
  };

  return (
    <Card className="flex h-[calc(100vh-10rem)] flex-col">
      <CardHeader><CardTitle>Qlim AI</CardTitle></CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "assistant" ? "bg-primary/10" : "bg-muted"}`}>
                {msg.role === "assistant" ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
              </div>
              <div className={`max-w-[75%] rounded-lg px-4 py-3 text-sm ${msg.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2 border-t pt-4">
          <Input placeholder="Ask about your emissions data..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <Button onClick={send}><Send className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}
