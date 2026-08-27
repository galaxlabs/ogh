"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Languages, Loader2, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { TRANSLATION_TARGETS } from "@/lib/site";
import type { Article } from "@/lib/data";

interface AiReaderProps {
  article: Article;
}

async function requestAi(path: string, payload: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (response.ok && data?.ok) {
    return data;
  }
  throw new Error(data?.message || `Request failed with status ${response.status}`);
}

export function AiReader({ article }: AiReaderProps) {
  const { currentLanguage } = useLanguage();
  const [targetLanguage, setTargetLanguage] = useState(
    currentLanguage === "ur" ? "Urdu" : currentLanguage === "ar" ? "Arabic" : "Urdu"
  );
  const [translatedContent, setTranslatedContent] = useState("");
  const [translationNotice, setTranslationNotice] = useState("");
  const [translationLoading, setTranslationLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState(
    /arxiv|llm|large language model|transformer|neural|diffusion|artificial intelligence|machine learning/i.test(
      `${article.title} ${article.category} ${article.excerpt}`
    )
      ? "Explain this AI research article in simple language: what problem it solves, how it works, the key result, and why it matters."
      : "Explain this post in simple terms with practical examples."
  );
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleTranslate = async () => {
    setTranslationLoading(true);
    setTranslationNotice("");
    try {
      const result = await requestAi("/api/ai/translate", {
        title: article.title,
        text: article.content,
        targetLanguage,
      });
      setTranslatedContent(result.content || "");
      setTranslationNotice(
        `Translated with ${result.provider} into ${targetLanguage}.`
      );
    } catch (error) {
      setTranslationNotice(
        error instanceof Error ? error.message : "Translation is not available yet."
      );
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleAskAi = async () => {
    setAiLoading(true);
    setAiAnswer("");
    try {
      const result = await requestAi("/api/ai/explain", {
        title: article.title,
        content: article.content,
        question: aiQuestion,
        language: currentLanguage === "ur" ? "Urdu" : currentLanguage === "ar" ? "Arabic" : "English",
      });
      setAiAnswer(result.answer || "No answer returned.");
    } catch (error) {
      setAiAnswer(error instanceof Error ? error.message : "AI explanation is not available yet.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border bg-muted/30 p-6">
      {/* Translation */}
      <div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Languages className="h-5 w-5 text-primary" />
              Read this post in any language
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Translate into Urdu, Arabic, or other languages, and ask the AI reader to explain
              the article.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
              aria-label="Translation language"
            >
              {TRANSLATION_TARGETS.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            <Button onClick={handleTranslate} disabled={translationLoading} className="gap-2">
              {translationLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Languages className="h-4 w-4" />
              )}
              Translate
            </Button>
          </div>
        </div>
        {translationNotice && <p className="mt-3 text-sm text-muted-foreground">{translationNotice}</p>}
        {translatedContent && (
          <div className="prose-article mt-4 rounded-xl border bg-background/60 p-4">
            {translatedContent.split("\n").map((line, index) =>
              line.trim() ? (
                <p key={index} className="mb-2">
                  {line}
                </p>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Ask AI */}
      <div className="border-t pt-5">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Bot className="h-5 w-5 text-primary" />
          Ask the AI reader
        </h3>
        <Textarea
          value={aiQuestion}
          onChange={(event) => setAiQuestion(event.target.value)}
          rows={3}
          className="mb-3"
          placeholder="Ask a question about this article..."
        />
        <Button onClick={handleAskAi} disabled={aiLoading} className="gap-2">
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Explain with AI
        </Button>
        {aiAnswer && (
          <div className="prose-article mt-4 rounded-xl border bg-background/60 p-4">
            {aiAnswer.split("\n").map((line, index) =>
              line.trim() ? (
                <p key={index} className="mb-2">
                  {line}
                </p>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
