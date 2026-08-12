"use client";

import Link from "next/link";
import { usePublication } from "@/components/publication-provider";
import { categoryLinkNetwork, relatedCategoriesFor } from "@/lib/publications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CategoryLinkNetwork() {
  const { publication } = usePublication();
  if (!publication) return null;

  const links = categoryLinkNetwork(publication);
  if (links.length === 0) return null;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">Explore Related Topics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.url}
              className="rounded-full border bg-muted/40 px-3 py-1.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RelatedCategoryLinks({ category }: { category: string }) {
  const related = relatedCategoriesFor(category);
  if (related.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="mb-2 text-sm font-semibold text-muted-foreground">More in this network</h4>
      <div className="flex flex-wrap gap-2">
        {related.map((link) => (
          <Link
            key={link.name}
            href={link.url}
            className="rounded-full border bg-muted/40 px-3 py-1.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {link.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
