"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/components/i18n/locale-provider";
import { defaultEndpointFor } from "@/lib/connected-systems/adapters";
import type { AuthMethod, ConnectPayload, ConnectorDef } from "@/lib/connected-systems/types";

export function ConnectDialog({
  connector,
  open,
  onOpenChange,
  onTest,
  onSave,
}: {
  connector: ConnectorDef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTest: (payload: ConnectPayload) => Promise<{ ok: boolean; message: string }>;
  onSave: (payload: ConnectPayload) => Promise<{ error?: string }>;
}) {
  const t = useT();
  const [connectionName, setConnectionName] = useState("");
  const [auth, setAuth] = useState<AuthMethod>("api_key");
  const [apiKey, setApiKey] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [region, setRegion] = useState("eu-central-1");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testOk, setTestOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!connector) return;
    setConnectionName(connector.name);
    setAuth(connector.authMethods[0] ?? "api_key");
    setApiKey("");
    setClientSecret("");
    setEndpoint(defaultEndpointFor(connector.id));
    setRegion("eu-central-1");
    setDescription("");
    setTestMsg(null);
    setTestOk(null);
  }, [connector]);

  if (!connector) return null;

  const payload = (): ConnectPayload => ({
    connectorId: connector.id,
    connectionName,
    authenticationType: auth,
    apiKey: apiKey || undefined,
    clientSecret: clientSecret || undefined,
    endpoint: endpoint || undefined,
    region: region || undefined,
    description: description || undefined,
    syncSchedule: "daily",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,560px)]">
        <DialogHeader>
          <DialogTitle className="type-title text-xl">
            {t("connectedSystemsPage.connectTitle", { name: connector.name })}
          </DialogTitle>
          <DialogDescription>{t("connectedSystemsPage.connectDesc")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label>{t("connectedSystemsPage.fieldConnectionName")}</Label>
            <Input value={connectionName} onChange={(e) => setConnectionName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("connectedSystemsPage.fieldAuth")}</Label>
            <Select value={auth} onValueChange={(v) => setAuth(v as AuthMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {connector.authMethods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {t(`connectedSystemsPage.auth.${m}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {auth === "api_key" && (
            <div className="space-y-2">
              <Label>{t("connectedSystemsPage.fieldApiKey")}</Label>
              <Input
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}
          {auth === "client_secret" && (
            <div className="space-y-2">
              <Label>{t("connectedSystemsPage.fieldClientSecret")}</Label>
              <Input
                type="password"
                autoComplete="off"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}
          {auth === "oauth" && (
            <p className="text-xs text-muted-foreground">{t("connectedSystemsPage.oauthNote")}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("connectedSystemsPage.fieldEndpoint")}</Label>
              <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label>{t("connectedSystemsPage.fieldRegion")}</Label>
              <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="eu-central-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("connectedSystemsPage.fieldDescription")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          {testMsg && (
            <p className={`text-sm ${testOk ? "text-[#2f6f24]" : "text-red-600"}`}>{testMsg}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t("connectedSystemsPage.cancel")}
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await onTest(payload());
                setTestMsg(r.message);
                setTestOk(r.ok);
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("connectedSystemsPage.testConnection")}
          </Button>
          <Button
            variant="brand"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await onSave(payload());
                if (!r.error) onOpenChange(false);
                else {
                  setTestMsg(r.error);
                  setTestOk(false);
                }
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("connectedSystemsPage.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
