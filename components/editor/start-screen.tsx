"use client";

import { useMemo, useState } from "react";
import { FilePlus2, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/lib/editor-store";
import {
  PAGE_SIZE_GROUPS,
  PAGE_SIZES,
  pageFromSize,
  type PageSizePreset,
} from "@/lib/page-sizes";
import {
  TEMPLATE_GROUPS,
  TEMPLATES,
  type StudioTemplate,
} from "@/lib/templates";
import { cn } from "@/lib/utils";

export function StartScreen() {
  const open = useEditorStore((s) => s.startOpen);
  const ready = useEditorStore((s) => s.sessionReady);
  const hasDocument = useEditorStore((s) => s.hasDocument);
  const [query, setQuery] = useState("");
  if (!ready) {
    return (
      <div
        className="absolute inset-0 z-50 bg-[#161310]"
        aria-hidden
      />
    );
  }
  if (!open) return null;

  const q = query.trim().toLowerCase();
  const sizes = PAGE_SIZES.filter(
    (s) =>
      !q ||
      s.label.toLowerCase().includes(q) ||
      s.hint.toLowerCase().includes(q) ||
      s.group.toLowerCase().includes(q),
  );
  const templates = TEMPLATES.filter(
    (t) =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.blurb.toLowerCase().includes(q) ||
      t.group.toLowerCase().includes(q),
  );
  const canContinue = hasDocument;

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-[#161310]/95 text-foreground backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-[family-name:var(--font-fraunces)] text-3xl tracking-tight">
              veillum
            </p>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Pick a page size, or start from a layout. The page in this browser saves itself as you work; New starts another one. Export a veillum JSON file if you want a copy you can move.
            </p>
          </div>
          {canContinue ? (
            <Button
              variant="outline"
              onClick={() => useEditorStore.getState().setStartOpen(false)}
            >
              Keep editing
            </Button>
          ) : null}
        </header>

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sizes and templates"
          className="max-w-sm bg-card/80"
          aria-label="Search sizes and templates"
        />

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <FilePlus2 className="size-3.5" />
            Blank page
          </h2>
          {PAGE_SIZE_GROUPS.map((group) => {
            const items = sizes.filter((s) => s.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-5">
                <p className="mb-2 text-[11px] text-muted-foreground/80">{group}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {items.map((preset) => (
                    <SizeCard key={preset.id} preset={preset} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <LayoutTemplate className="size-3.5" />
            Templates
          </h2>
          {TEMPLATE_GROUPS.map((group) => {
            const items = templates.filter((t) => t.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-6">
                <p className="mb-2 text-[11px] text-muted-foreground/80">{group}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <TemplateCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {sizes.length === 0 && templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing matches that search.</p>
        ) : null}
      </div>
    </div>
  );
}

function SizeCard({ preset }: { preset: PageSizePreset }) {
  const paper = pageFromSize(preset).background;
  const max = 56;
  const scale = Math.min(max / preset.width, max / preset.height);
  const w = Math.max(10, preset.width * scale);
  const h = Math.max(10, preset.height * scale);
  return (
    <button
      type="button"
      onClick={() => useEditorStore.getState().startBlank(preset)}
      className="flex flex-col items-start gap-2 rounded-xl border border-border/70 bg-card/90 p-3 text-left transition hover:border-primary/50 hover:bg-card"
    >
      <span
        className="rounded-sm border border-foreground/20"
        style={{ width: w, height: h, background: paper }}
        aria-hidden
      />
      <span className="text-sm font-medium leading-tight">{preset.label}</span>
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {preset.width} × {preset.height}
        <span className="block font-normal tracking-normal text-muted-foreground/80">
          {preset.hint}
        </span>
      </span>
    </button>
  );
}

function TemplateCard({ item }: { item: StudioTemplate }) {
  const page = useMemo(() => item.page(), [item]);
  const maxW = 160;
  const maxH = 92;
  const scale = Math.min(maxW / page.width, maxH / page.height);
  const w = page.width * scale;
  const h = page.height * scale;
  return (
    <button
      type="button"
      onClick={() => useEditorStore.getState().loadTemplate(item.id)}
      className="flex gap-3 rounded-xl border border-border/70 bg-card/90 p-3 text-left transition hover:border-primary/50 hover:bg-card"
    >
      <span
        className={cn("mt-0.5 shrink-0 rounded-sm border border-black/20 shadow-sm")}
        style={{
          width: w,
          height: h,
          background: page.background,
        }}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{item.name}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {item.blurb}
        </span>
        <span className="mt-2 block text-[11px] tabular-nums text-muted-foreground/80">
          {page.width} × {page.height}
        </span>
      </span>
    </button>
  );
}
