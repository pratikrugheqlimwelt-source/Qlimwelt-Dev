/**
 * OpenAI-compatible client for free/open-source LLMs.
 * Providers: Ollama (local), Groq (free tier, open weights), or any OpenAI-compatible base URL.
 *
 * Note: Ollama cannot run on Vercel serverless. Production uses Groq (or another cloud endpoint)
 * with the same carbon consultant system prompt from carbon-prompt.ts.
 */

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmProviderInfo = {
  provider: "ollama" | "groq" | "openai-compatible" | "none";
  model: string;
  baseUrl: string;
  configured: boolean;
};

export function getLlmConfig(): LlmProviderInfo & { apiKey: string } {
  const explicit = (process.env.LLM_PROVIDER ?? "").toLowerCase();
  const groqKey = process.env.GROQ_API_KEY ?? "";
  const customBase = process.env.LLM_BASE_URL ?? "";
  const customKey = process.env.LLM_API_KEY ?? "";
  const onVercel = Boolean(process.env.VERCEL);

  // Vercel: Ollama is unreachable — always prefer Groq when a key is present
  if (onVercel && groqKey && explicit !== "openai-compatible") {
    return {
      provider: "groq",
      model: process.env.LLM_MODEL && !process.env.LLM_MODEL.includes("qlimwelt")
        ? process.env.LLM_MODEL
        : "llama-3.1-8b-instant",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groqKey,
      configured: true,
    };
  }

  if (explicit === "groq" || (!explicit && groqKey && !customBase)) {
    return {
      provider: "groq",
      model: process.env.LLM_MODEL || "llama-3.1-8b-instant",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groqKey,
      configured: Boolean(groqKey),
    };
  }

  if (explicit === "openai-compatible" || customBase) {
    return {
      provider: "openai-compatible",
      model: process.env.LLM_MODEL || "llama3.2",
      baseUrl: (customBase || "http://127.0.0.1:11434/v1").replace(/\/$/, ""),
      apiKey: customKey || "ollama",
      configured: true,
    };
  }

  // On Vercel without Groq: mark unconfigured so the UI shows a clear error
  if (onVercel && !groqKey) {
    return {
      provider: "none",
      model: "",
      baseUrl: "",
      apiKey: "",
      configured: false,
    };
  }

  // Local Ollama — prefer carbon-tuned model if created
  return {
    provider: "ollama",
    model: process.env.LLM_MODEL || "qlimwelt-carbon",
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
      "LLM is not configured. Locally: run Ollama (qlimwelt-carbon). On Vercel: set GROQ_API_KEY and LLM_PROVIDER=groq."
    );
  }

  const tryModel = async (model: string) => {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts?.temperature ?? 0.2,
        max_tokens: opts?.maxTokens ?? 1024,
      }),
    });
    return res;
  };

  let usedModel = cfg.model;
  let res = await tryModel(usedModel);

  // Fallback if tuned model not created yet
  if (!res.ok && cfg.provider === "ollama" && usedModel === "qlimwelt-carbon") {
    usedModel = "llama3.2";
    res = await tryModel(usedModel);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      cfg.provider === "ollama"
        ? `Ollama error (${res.status}). Run: ollama create qlimwelt-carbon -f ollama/Modelfile  (or ollama pull llama3.2). ${text.slice(0, 200)}`
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

/** @deprecated use buildCarbonSystemPrompt from carbon-prompt */
export function buildClimateSystemPrompt(context: {
  companyName: string;
  period: string;
  totalTCO2e: number;
  scope1: number;
  scope2: number;
  scope3: number;
  activityCount: number;
  topCategories: { category: string; tCO2e: number }[];
  insights: string[];
}) {
  return `You are Qlim AI for ${context.companyName}. Total ${context.totalTCO2e.toFixed(2)} tCO2e. S1 ${context.scope1.toFixed(2)} S2 ${context.scope2.toFixed(2)} S3 ${context.scope3.toFixed(2)}. Activities ${context.activityCount}.`;
}
