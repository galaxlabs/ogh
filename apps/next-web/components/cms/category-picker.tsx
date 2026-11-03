"use client";

import { useMemo } from "react";
import { Check, ChevronRight, FolderTree } from "lucide-react";

export interface CategoryOption {
  slug: string;
  name: string;
  level: number;
  articleCount: number;
  subdomain: string;
  children: CategoryOption[];
}

function flatten(nodes: CategoryOption[]) {
  const rows: CategoryOption[] = [];
  const walk = (list: CategoryOption[]) => {
    for (const node of list) {
      rows.push(node);
      walk(node.children || []);
    }
  };
  walk(nodes);
  return rows;
}

export function CategoryPicker({
  groups,
  value,
  onChange,
  disabled,
}: {
  groups: CategoryOption[];
  value?: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
}) {
  const options = useMemo(() => flatten(groups), [groups]);
  const selected = options.find((option) => option.slug === value);

  if (!groups.length) {
    return (
      <p className="rounded-lg border border-dashed p-3 text-xs text-slate-500">
        No categories are published yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <select
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Topic category"
        className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm disabled:opacity-60 dark:bg-white/5"
      >
        <option value="">No topic assigned</option>
        {groups.map((group) => (
          <optgroup key={group.slug} label={group.name}>
            <option value={group.slug}>
              {group.name}
            </option>
            {(group.children || []).map((subgroup) => (
              <option key={subgroup.slug} value={subgroup.slug}>
                &nbsp;&nbsp;{subgroup.name}
              </option>
            ))}
            {(group.children || []).flatMap((subgroup) =>
              (subgroup.children || []).map((leaf) => (
                <option key={leaf.slug} value={leaf.slug}>
                  &nbsp;&nbsp;&nbsp;&nbsp;{leaf.name}
                </option>
              ))
            )}
          </optgroup>
        ))}
      </select>

      {selected && (
        <div className="rounded-lg border border-black/10 bg-white p-2.5 text-xs dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-1 flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
            <FolderTree className="size-3.5" /> {selected.name}
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-white/10">
              level {selected.level}
            </span>
            {selected.subdomain && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-white/10">
                {selected.subdomain}.openguidehub.org
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-white/10">
              {selected.articleCount} articles
            </span>
          </div>
        </div>
      )}

      <div className="max-h-40 overflow-y-auto rounded-lg border border-black/10 p-2 text-xs dark:border-white/10">
        {groups.map((group) => (
          <div key={group.slug} className="mb-1.5 last:mb-0">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(group.slug)}
              className={`flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left font-medium transition hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/10 ${
                value === group.slug ? "text-primary" : ""
              }`}
            >
              <span className="flex items-center gap-1.5">
                {value === group.slug && <Check className="size-3.5" />}
                {group.name}
              </span>
              <span className="text-[11px] text-slate-400">{group.articleCount}</span>
            </button>
            {(group.children || []).map((subgroup) => (
              <div key={subgroup.slug} className="ms-3 border-s border-black/10 ps-2 dark:border-white/10">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(subgroup.slug)}
                  className={`flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left transition hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/10 ${
                    value === subgroup.slug ? "font-medium text-primary" : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronRight className="size-3" />
                    {subgroup.name}
                  </span>
                  <span className="text-[11px] text-slate-400">{subgroup.articleCount}</span>
                </button>
                {(subgroup.children || []).map((leaf) => (
                  <button
                    key={leaf.slug}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(leaf.slug)}
                    className={`flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left transition hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/10 ${
                      value === leaf.slug ? "font-medium text-primary" : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <span className="ms-4">{leaf.name}</span>
                    <span className="text-[11px] text-slate-400">{leaf.articleCount}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
