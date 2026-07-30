/** Compliance Center domain models */

export type ComplianceStatus = "on_track" | "at_risk" | "critical" | "complete";
export type RequirementStatus = "complete" | "warning" | "missing" | "in_progress";
export type EvidenceVerification = "verified" | "pending" | "rejected";
export type Priority = "high" | "medium" | "low";

export interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  description: string;
  completion: number;
  status: ComplianceStatus;
  updatedAt: string;
  overview: string;
  missingData: string[];
  recommendedActions: string[];
  estimatedTimeToComplete: string;
  requirements: ComplianceRequirement[];
}

export interface ComplianceRequirement {
  id: string;
  frameworkId: string;
  title: string;
  status: RequirementStatus;
  priority: Priority;
  recommendation: string;
  detail?: string;
}

export interface ComplianceEvidence {
  id: string;
  name: string;
  framework: string;
  fileUrl: string;
  verified: EvidenceVerification;
  uploadedBy: string;
  uploadDate: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  relativeLabel: string;
}

export interface RegulationUpdate {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  summary: string;
}

export interface ComplianceOverview {
  overallCompliance: number;
  frameworksActive: number;
  openIssues: number;
  upcomingDeadlines: number;
}

export interface ValidationItem {
  id: string;
  label: string;
  status: "pass" | "warn";
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
}

export interface ComplianceDashboardPayload {
  overview: ComplianceOverview;
  frameworks: ComplianceFramework[];
  progressChecklist: ComplianceRequirement[];
  evidence: ComplianceEvidence[];
  auditLog: AuditLogEntry[];
  regulations: RegulationUpdate[];
  validation: {
    readinessScore: number;
    auditRisk: "low" | "medium" | "high";
    items: ValidationItem[];
  };
  exports: ExportTemplate[];
  aiInsight: string;
}
