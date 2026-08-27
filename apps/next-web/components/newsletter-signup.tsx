"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const { translations } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // Simulated subscription. Replace with a real mailing-list integration when available.
    setTimeout(() => {
      setLoading(false);
      setEmail("");
      toast.success(
        translations?.common?.newsletterSuccess || "Thanks for subscribing! Check your inbox."
      );
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={translations?.common?.email || "Your email"}
        className={compact ? "h-9 text-sm" : ""}
        aria-label={translations?.common?.email || "Email"}
      />
      <Button type="submit" size={compact ? "sm" : "default"} disabled={loading} className="gap-1.5">
        <Send className="h-4 w-4" />
        {translations?.common?.subscribe || "Subscribe"}
      </Button>
    </form>
  );
}
