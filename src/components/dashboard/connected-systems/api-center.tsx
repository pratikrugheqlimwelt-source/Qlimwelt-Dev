"use client";

import { useState } from "react";
import { Copy, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/locale-provider";
import type { CompanyApiKey } from "@/lib/connected-systems/types";
import { toast } from "@/hooks/use-toast";

export function ApiCenter({
  keys,
  onCreate,
  onRevoke,
}: {
  keys: CompanyApiKey[];
  onCreate: (name: string) => Promise<{ raw: string }>;
  onRevoke: (id: string) => Promise<void>;
}) {
  const t = useT();
  const [name, setName] = useState("Production");
  const [busy, setBusy] = useState(false);
  const [rawOnce, setRawOnce] = useState<string | null>(null);

  const example = `curl -X GET https://api.qlimwelt.com/v1/emissions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: t("connectedSystemsPage.copied") });
  };

  return (
    <div className="dash-card p-6">
      <p className="dash-label">{t("connectedSystemsPage.apiLabel")}</p>
      <h3 className="type-title mt-2 text-lg">{t("connectedSystemsPage.apiTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("connectedSystemsPage.apiBody")}</p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="sm:max-w-xs" />
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const { raw } = await onCreate(name);
              setRawOnce(raw);
              toast({ title: t("connectedSystemsPage.keyCreated") });
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
          {t("connectedSystemsPage.generateKey")}
        </Button>
      </div>

      {rawOnce && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="font-semibold text-amber-900">{t("connectedSystemsPage.keyOnce")}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 break-all font-mono text-xs">{rawOnce}</code>
            <Button size="sm" variant="outline" onClick={() => copy(rawOnce)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {keys.map((k) => (
          <li
            key={k.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-semibold">{k.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{k.keyPrefix}…</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onRevoke(k.id)}>
              {t("connectedSystemsPage.revoke")}
            </Button>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("connectedSystemsPage.webhook")}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate font-mono text-xs">
              https://api.qlimwelt.com/v1/webhooks/{"{company}"}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy("https://api.qlimwelt.com/v1/webhooks/{company}")}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 text-slate-100">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t("connectedSystemsPage.exampleRequest")}
            </p>
            <Button size="sm" variant="secondary" onClick={() => copy(example)}>
              <Copy className="mr-1 h-3.5 w-3.5" />
              {t("connectedSystemsPage.copy")}
            </Button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
            {example}
          </pre>
        </div>
        <p className="text-xs text-muted-foreground">{t("connectedSystemsPage.rateLimit")}</p>
      </div>
    </div>
  );
}
