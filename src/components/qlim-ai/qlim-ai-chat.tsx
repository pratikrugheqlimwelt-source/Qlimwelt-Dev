"use client";

import * as React from "react";
import Image from "next/image";
import { User, Send, Loader2, X } from "lucide-react";
import { TypewriterText } from "@/components/marketing/marketing-ui";
import { ChatMarkdown } from "@/components/qlim-ai/chat-markdown";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

export function QlimAiChat({
  messages: initialMessages,
  animateLast = false,
  interactive = false,
  className,
  messagesClassName,
  fill = false,
  onClose,
  draftPrompt,
}: {
  messages: Message[];
  animateLast?: boolean;
  /** When true, enables live chat against /api/qlim-ai/chat (Ollama / Groq). */
  interactive?: boolean;
  className?: string;
  messagesClassName?: string;
  /** Stretch to parent height (dashboard workspace). */
  fill?: boolean;
  /** Optional close control in the chat header (floating widget). */
  onClose?: () => void;
  /** Prefill the composer (e.g. Connected Systems assistant). */
  draftPrompt?: string;
}) {
  const t = useT();
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [input, setInput] = React.useState(draftPrompt ?? "");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [providerKey, setProviderKey] = React.useState<"preview" | "notConfigured" | "offline" | "live">(
    "preview"
  );
  const [providerLive, setProviderLive] = React.useState<string>("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  React.useEffect(() => {
    if (draftPrompt) setInput(draftPrompt);
  }, [draftPrompt]);

  React.useEffect(() => {
    if (!interactive) {
      setProviderKey("preview");
      return;
    }
    fetch("/api/qlim-ai/chat")
      .then((r) => r.json())
      .then((d: { provider?: string; model?: string; configured?: boolean }) => {
        if (d.configured) {
          setProviderKey("live");
          setProviderLive(`${d.provider} · ${d.model}`);
        } else {
          setProviderKey("notConfigured");
        }
      })
      .catch(() => setProviderKey("offline"));
  }, [interactive]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const lastAssistantIdx = messages
    .map((m, i) => (m.role === "assistant" ? i : -1))
    .filter((i) => i >= 0)
    .pop();

  const providerLabel =
    providerKey === "live"
      ? providerLive
      : providerKey === "notConfigured"
        ? t("qlimAiChat.notConfigured")
        : providerKey === "offline"
          ? t("qlimAiChat.offline")
          : t("qlimAiChat.preview");

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    const nextUser: Message = { role: "user", content: text };
    const history = [...messages, nextUser].slice(-20);
    setMessages(history);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/qlim-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = (await res.json()) as {
        message?: Message;
        error?: string;
        provider?: string;
        model?: string;
      };
      if (!res.ok) throw new Error(data.error || t("qlimAiChat.requestFailed"));
      if (data.provider && data.model) {
        setProviderKey("live");
        setProviderLive(`${data.provider} · ${data.model}`);
      }
      setMessages((prev) => [...prev, data.message!]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("qlimAiChat.chatFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm",
        fill && "h-full",
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light ring-1 ring-brand/20">
            <Image
              src="/logo-mark.png"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
              aria-hidden
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-brand" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              {t("qlimAiChat.brandName")}
            </p>
            <p className="truncate text-xs text-muted-foreground">{t("qlimAiChat.subtitle")}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="max-w-[9.5rem] truncate rounded-full bg-brand-light px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-brand-dark sm:max-w-[14rem]">
            {interactive ? providerLabel : t("qlimAiChat.preview")}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t("qlimAiChat.closeChat")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5",
          fill ? "flex-1" : "max-h-[22rem]",
          messagesClassName
        )}
      >
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={`${i}-${msg.role}-${msg.content.slice(0, 12)}`}
              className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  isUser ? "bg-muted text-muted-foreground" : "bg-brand-light text-brand-dark"
                )}
              >
                {isUser ? (
                  <User className="h-3.5 w-3.5" strokeWidth={1.75} />
                ) : (
                  <Image
                    src="/logo-mark.png"
                    alt=""
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 object-contain"
                    aria-hidden
                  />
                )}
              </div>
              <div
                className={cn(
                  "min-w-0 max-w-[min(100%,36rem)] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                  isUser
                    ? "rounded-tr-md bg-muted text-foreground"
                    : "rounded-tl-md border border-brand/20 bg-brand-light text-foreground"
                )}
              >
                {animateLast && !interactive && i === lastAssistantIdx ? (
                  <TypewriterText text={msg.content} speed={12} />
                ) : isUser ? (
                  <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                ) : (
                  <ChatMarkdown text={msg.content} />
                )}
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("qlimAiChat.thinking")}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-border px-4 py-3 sm:px-5">
        {interactive ? (
          <div className="space-y-2">
            {error && <p className="text-xs text-destructive">{error}</p>}
            <form
              className="flex min-w-0 items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("qlimAiChat.placeholder")}
                className="min-w-0 flex-1 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm outline-none ring-brand/30 focus:ring-2"
                disabled={sending}
              />
              <Button
                type="submit"
                size="sm"
                className="h-10 shrink-0 gap-1.5 px-3"
                disabled={sending || !input.trim()}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">{t("qlimAiChat.send")}</span>
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 ring-1 ring-border">
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {t("qlimAiChat.previewBanner")}
            </span>
            <span className="shrink-0 rounded-lg bg-brand-light px-2 py-1 text-[10px] font-medium text-brand-dark">
              {t("qlimAiChat.preview")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
