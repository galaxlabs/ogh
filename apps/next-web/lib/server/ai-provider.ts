import { NextResponse } from "next/server";

export interface AiConfig {
  /** Provider key: cloud, openai or cloudflare. */
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
  /** Cloudflare Workers AI uses a different request shape. */
  style: "openai" | "workers_ai";
}

function env(value: string | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

/**
 * Every configured provider, in the order they should be tried.
 *
 * The cloud endpoint (AI_API_URL) keeps priority because it is the cheap local
 * one, OpenAI is the fallback, and Cloudflare Workers AI is the last resort.
 * Any combination can be enabled at the same time.
 */
function getConfigs(): AiConfig[] {
  const configs: AiConfig[] = [];

  const cloudEndpoint = env(process.env.AI_API_URL);
  if (cloudEndpoint) {
    configs.push({
      name: "cloud",
      endpoint: cloudEndpoint.replace(/\/+$/, ""),
      apiKey: env(process.env.AI_API_KEY),
      model: env(process.env.AI_MODEL) || "qwen2.5:7b",
      style: "openai",
    });
  }

  const openaiKey = env(process.env.OPENAI_API_KEY);
  if (openaiKey) {
    configs.push({
      name: "openai",
      endpoint: (env(process.env.OPENAI_BASE_URL) || "https://api.openai.com/v1").replace(/\/+$/, ""),
      apiKey: openaiKey,
      model: env(process.env.OPENAI_MODEL) || "gpt-4o-mini",
      style: "openai",
    });
  }

  const cfToken = env(process.env.CLOUDFLARE_AI_TOKEN);
  const cfAccount = env(process.env.CLOUDFLARE_AI_ACCOUNT_ID);
  if (cfToken && cfAccount) {
    const model = env(process.env.CLOUDFLARE_AI_MODEL) || "@cf/meta/llama-3.1-8b-instruct";
    configs.push({
      name: "cloudflare",
      endpoint: `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${model}`,
      apiKey: cfToken,
      model,
      style: "workers_ai",
    });
  }

  return configs;
}

function isConfigured() {
  return getConfigs().length > 0;
}

async function callProvider(config: AiConfig, prompt: string, system: string, maxTokens: number) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const body =
    config.style === "openai"
      ? {
          model: config.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: maxTokens,
        }
      : {
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          max_tokens: maxTokens,
        };

  const url =
    config.style === "openai"
      ? `${config.endpoint}/v1/chat/completions`
      : config.endpoint;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`AI request failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  if (config.style === "workers_ai") {
    const result = data?.result;
    if (typeof result === "string") return result;
    return result?.response || "";
  }
  return data?.choices?.[0]?.message?.content || "";
}

/**
 * Try each provider in order and return the first usable answer.
 * The failed attempts are reported so the studio can show what happened.
 */
export async function callCompletionsWithFallback(
  prompt: string,
  system: string,
  maxTokens = 1800
): Promise<{ content: string; provider: string; model: string; errors: string[] }> {
  const configs = getConfigs();
  if (!configs.length) {
    throw new Error(
      "No AI provider is configured. Set AI_API_URL, OPENAI_API_KEY or CLOUDFLARE_AI_TOKEN."
    );
  }

  const errors: string[] = [];
  for (const config of configs) {
    try {
      const content = await callProvider(config, prompt, system, maxTokens);
      if (content) {
        return { content, provider: config.name, model: config.model, errors };
      }
      errors.push(`${config.name}: empty response`);
    } catch (error) {
      errors.push(
        `${config.name}: ${error instanceof Error ? error.message : "request failed"}`
      );
    }
  }

  throw new Error(errors.join(" | ") || "All AI providers failed.");
}

async function callCompletions(prompt: string, system: string, maxTokens = 1800) {
  const result = await callCompletionsWithFallback(prompt, system, maxTokens);
  return result.content;
}

const TRANSLATE_SYSTEM =
  "You are a professional translator for OpenGuideHub. Translate the provided article title and body into the requested language. Preserve markdown headings, lists, and emphasis exactly. Return only the translated text with no preamble.";

const EXPLAIN_SYSTEM =
  "You are the AI reader assistant for OpenGuideHub. Explain the article in simple, clear language that directly answers the reader's question. Use short paragraphs and simple vocabulary. Return plain text with no markdown headers.";

export async function translateArticle(payload: {
  title: string;
  text: string;
  targetLanguage: string;
}) {
  if (!isConfigured()) {
    return NextResponse.json({
      ok: false,
      message:
        "Translation is not available yet. The AI service is not configured on this deployment.",
    });
  }

  const { title, text, targetLanguage } = payload;
  if (!text) {
    return NextResponse.json({ ok: false, message: "Missing article text." }, { status: 400 });
  }

  const source = String(title || "").slice(0, 300);
  const body = String(text || "").slice(0, 24000);

  try {
    const result = await callCompletions(
      `Translate the following article into ${targetLanguage}.\n\nTITLE:\n${source}\n\nBODY:\n${body}`,
      TRANSLATE_SYSTEM,
      4000
    );
    return NextResponse.json({
      ok: true,
      provider: process.env.AI_PROVIDER || "OpenGuideHub AI",
      content: result || "",
      targetLanguage,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Translation failed.",
      },
      { status: 502 }
    );
  }
}

export async function explainArticle(payload: {
  title: string;
  content: string;
  question: string;
  language: string;
}) {
  if (!isConfigured()) {
    return NextResponse.json({
      ok: false,
      message: "AI explanation is not available yet. The AI service is not configured on this deployment.",
    });
  }

  const { title, content, question, language } = payload;
  if (!content) {
    return NextResponse.json({ ok: false, message: "Missing article content." }, { status: 400 });
  }

  const source = String(title || "").slice(0, 300);
  const body = String(content || "").slice(0, 24000);
  const lang = language || "English";

  try {
    const answer = await callCompletions(
      `Article title: ${source}\n\nArticle content:\n${body}\n\nQuestion: ${question}\n\nAnswer in ${lang}.`,
      EXPLAIN_SYSTEM,
      1500
    );
    return NextResponse.json({ ok: true, answer: answer || "" });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "AI explanation failed.",
      },
      { status: 502 }
    );
  }
}

export function aiStatus() {
  const configs = getConfigs();
  return {
    ok: configs.length > 0,
    configured: configs.length > 0,
    provider: process.env.AI_PROVIDER || configs[0]?.name || "not configured",
    model: process.env.AI_MODEL || configs[0]?.model || "qwen2.5:7b",
    providers: configs.map((config) => ({ name: config.name, model: config.model })),
  };
}
