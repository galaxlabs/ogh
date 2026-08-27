import { NextResponse } from "next/server";

interface AiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

function getConfig(): AiConfig | null {
  const endpoint = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "qwen2.5:7b";

  if (!endpoint) return null;
  return { endpoint, apiKey: apiKey || "", model };
}

function isConfigured() {
  return Boolean(getConfig());
}

async function callCompletions(prompt: string, system: string, maxTokens = 1800) {
  const config = getConfig();
  if (!config) {
    throw new Error("AI service is not configured. Set AI_API_URL (and optionally AI_API_KEY).");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(`${config.endpoint.replace(/\/+$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`AI request failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
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
  return {
    ok: isConfigured(),
    configured: isConfigured(),
    provider: process.env.AI_PROVIDER || "not configured",
    model: process.env.AI_MODEL || "qwen2.5:7b",
  };
}
