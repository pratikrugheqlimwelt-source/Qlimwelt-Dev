/**
 * OpenAI-compatible client for free/open-source LLMs.
 * - Local: Ollama (free, preferred) — optional Groq free tier
 * - Vercel: Groq free tier only (Ollama cannot run on serverless)
 * Same carbon consultant system prompt is used for both.
 */

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmProviderInfo = {
  provider: "ollama" | "groq" | "openai-compatible" | "none";
  model: string;
  baseUrl: string;
  configured: boolean;
};

function groqModel() {
  const m = process.env.LLM_MODEL ?? "";
  if (m && !m.includes("qlimwelt") && !m.startsWith("llama3.2")) return m;
  return "llama-3.1-8b-instant";
}

function ollamaModel() {
  const m = process.env.LLM_MODEL ?? "";
  if (m && (m.includes("qlimwelt") || m.includes("llama3") || m.includes("qwen"))) return m;
  return "qlimwelt-carbon";
}

export function getLlmConfig(): LlmProviderInfo & { apiKey: string } {
  const explicit = (process.env.LLM_PROVIDER ?? "").toLowerCase().trim();
  const groqKey = (process.env.GROQ_API_KEY ?? "").trim();
  const customBase = (process.env.LLM_BASE_URL ?? "").trim();
  const customKey = (process.env.LLM_API_KEY ?? "").trim();
  const onVercel = Boolean(process.env.VERCEL);

  // --- Vercel production: Groq free tier only ---
  if (onVercel) {
    if (groqKey) {
      return {
        provider: "groq",
        model: groqModel(),
        baseUrl: "https://api.groq.com/openai/v1",
        apiKey: groqKey,
        configured: true,
      };
    }
    return { provider: "none", model: "", baseUrl: "", apiKey: "", configured: false };
  }

  // --- Local / non-Vercel ---
  // Explicit Groq with a key
  if (explicit === "groq" && groqKey) {
    return {
      provider: "groq",
      model: groqModel(),
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groqKey,
      configured: true,
    };
  }

  // Custom OpenAI-compatible endpoint
  if (explicit === "openai-compatible" || customBase) {
    return {
      provider: "openai-compatible",
      model: process.env.LLM_MODEL || "llama3.2",
      baseUrl: (customBase || "http://127.0.0.1:11434/v1").replace(/\/$/, ""),
      apiKey: customKey || "ollama",
      configured: true,
    };
  }

  // Default local: free Ollama (even if LLM_PROVIDER=groq was set without a usable key)
  return {
    provider: "ollama",
    model: ollamaModel(),
    baseUrl: (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1").replace(/\/$/, ""),
    apiKey: "ollama",
    configured: true,
  };
}

export async function chatCompletion(
  messages: LlmMessage[],
  opts?: { temperature?: number; maxTokens?: number }
): Promise<{ content: string; provider: string; model: string }> {
  const cfg = getLlmConfig();
  if (!cfg.configured) {
    throw new Error(
      "No free LLM configured. Locally: run Ollama (qlimwelt-carbon). On Vercel: add GROQ_API_KEY from the free Groq tier (console.groq.com — no credit card)."
    );
  }

  const tryModel = async (model: string) =>
    fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts?.temperature ?? 0.35,
        max_tokens: opts?.maxTokens ?? 1100,
      }),
    });

  let usedModel = cfg.model;
  let res = await tryModel(usedModel);

  if (!res.ok && cfg.provider === "ollama" && usedModel === "qlimwelt-carbon") {
    usedModel = "llama3.2";
    res = await tryModel(usedModel);
  }

  // If Groq fails locally, fall back to Ollama automatically
  if (!res.ok && cfg.provider === "groq") {
    const ollamaBase = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1").replace(/\/$/, "");
    for (const fallback of ["qlimwelt-carbon", "llama3.2"]) {
      const fallbackRes = await fetch(`${ollamaBase}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer ollama",
        },
        body: JSON.stringify({
          model: fallback,
          messages,
          temperature: opts?.temperature ?? 0.35,
          max_tokens: opts?.maxTokens ?? 1100,
        }),
      });
      if (fallbackRes.ok) {
        const data = (await fallbackRes.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return { content, provider: "ollama", model: fallback };
      }
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      cfg.provider === "ollama"
        ? `Ollama error (${res.status}). Run: ollama create qlimwelt-carbon -f ollama/Modelfile. ${text.slice(0, 200)}`
        : `LLM provider error (${res.status}): ${text.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("LLM returned an empty response.");
  return { content, provider: cfg.provider, model: usedModel };
}
