import Link from "next/link";
import { ArrowUpRight, FolderTree } from "lucide-react";
import type { CategoryNode } from "@/lib/cms";

function groupHref(node: CategoryNode) {
  return `/categories/${node.slug}`;
}

export function CategoryTree({
  groups,
}: {
  groups: CategoryNode[];
  currentSubdomain?: string | null;
}) {
  return (
    <div className="space-y-10">
      {groups.map((group) => {
        return (
          <section key={group.slug} className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">{group.name}</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {group.article_count} article{group.article_count === 1 ? "" : "s"}
                </span>
                <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {group.publication_code ? group.publication_code : "main group"}
                </span>
              </div>
              <a
                href={groupHref(group)}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Browse <ArrowUpRight className="size-4" />
              </a>
            </div>

            {group.description && (
              <p className="mb-5 max-w-3xl text-sm leading-6 text-muted-foreground">
                {group.description}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.children.map((subgroup) => (
                <div
                  key={subgroup.slug}
                  className="rounded-xl border border-black/10 bg-card/60 p-4 dark:border-white/10"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Link
                      href={`/categories/${subgroup.slug}`}
                      className="font-semibold hover:underline"
                    >
                      {subgroup.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {subgroup.article_count}
                    </span>
                  </div>
                  {subgroup.description && (
                    <p className="mb-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {subgroup.description}
                    </p>
                  )}
                  <ul className="space-y-1.5">
                    {subgroup.children.map((leaf) => (
                      <li key={leaf.slug}>
                        <Link
                          href={`/categories/${leaf.slug}`}
                          className="group flex items-center justify-between gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                        >
                          <span>{leaf.name}</span>
                          <span className="text-[11px] opacity-60">{leaf.article_count}</span>
                        </Link>
                      </li>
                    ))}
                    {!subgroup.children.length && (
                      <li className="text-xs text-muted-foreground">No sub topics yet.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {!groups.length && (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <FolderTree className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            No categories are configured yet.
          </p>
        </div>
      )}
    </div>
  );
}
