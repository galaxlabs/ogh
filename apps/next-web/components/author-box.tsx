"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { Author } from "@/lib/data";
import { useLanguage } from "@/components/language-provider";

export function AuthorBox({ author }: { author: Author }) {
  const { translations } = useLanguage();

  if (!author) return null;

  return (
    <Card className="bg-muted">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-xl">
            <AvatarFallback className="rounded-xl bg-primary text-lg text-primary-foreground">
              {author.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="mb-1 font-semibold">
              {translations?.common?.aboutAuthor || "About the Author"}
            </h4>
            <p className="mb-2 text-lg font-medium">{author.name}</p>
            <p className="text-sm leading-relaxed">{author.bio}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
