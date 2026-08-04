"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useT } from "@/components/i18n/locale-provider";

const NODES = [
  "flowSap",
  "flowInvoices",
  "flowPo",
  "flowEnergy",
  "flowTravel",
  "flowSupplier",
  "flowQlimwelt",
  "flowEngine",
  "flowAi",
  "flowDashboard",
  "flowCompliance",
] as const;

export function DataFlowViz() {
  const t = useT();
  const reduced = useReducedMotion();

  return (
    <div className="dash-card p-6">
      <p className="dash-label">{t("connectedSystemsPage.dataFlowLabel")}</p>
      <h3 className="type-title mt-2 text-lg">{t("connectedSystemsPage.dataFlowTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("connectedSystemsPage.dataFlowBody")}</p>

      <div className="relative mt-6 overflow-x-auto pb-2">
        <div className="flex min-w-max items-center gap-2">
          {NODES.map((key, i) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className={
                  key === "flowQlimwelt"
                    ? "rounded-xl border border-[#82D153]/40 bg-[#82D153]/12 px-3 py-2 text-xs font-semibold text-[#2f6f24]"
                    : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                }
              >
                {t(`connectedSystemsPage.${key}`)}
              </div>
              {i < NODES.length - 1 && (
                <div className="relative h-px w-6 bg-slate-200">
                  {!reduced && (
                    <motion.span
                      className="absolute -top-0.5 h-1.5 w-1.5 rounded-full bg-[#82D153]"
                      animate={{ x: [0, 20], opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.12, ease: "linear" }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
