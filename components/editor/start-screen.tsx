"use client";

import { useEffect, useMemo, useState } from "react";
import { FilePlus2, FolderOpen, HardDrive, LayoutTemplate } from "lucide-react";
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
  templatePreviewContent,
  type StudioTemplate,
} from "@/lib/templates";
import { PagePreview } from "./page-preview";
import { openProjectFile, openSitePage } from "./file-actions";
import { fetchSitePage, fetchSitePages, removeSitePage } from "@/lib/site-library";
import type { SitePageMeta, SitePageRecord } from "@/lib/site-pages";
import { migrateDocument } from "@/lib/document";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function StartScreen() {
  const open = useEditorStore((s) => s.startOpen);
  const ready = useEditorStore((s) => s.sessionReady);
  const hasDocument = useEditorStore((s) => s.hasDocument);
  const [query, setQuery] = useState("");
  const [siteHits, setSiteHits] = useState(0);
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
              Pick a page size, start from a layout, or reopen a page saved on this site. Save writes here; Save as… writes a file on disk.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => void openProjectFile()}>
              <FolderOpen />
              Open file
            </Button>
            {canContinue ? (
              <Button
                variant="outline"
                onClick={() => useEditorStore.getState().setStartOpen(false)}
              >
                Continue this page
              </Button>
            ) : null}
          </div>
        </header>

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sizes, templates, and saved pages"
          className="max-w-sm bg-card/80"
          aria-label="Search sizes and templates"
        />

        <SitePagesPanel query={q} onFilteredCount={setSiteHits} />

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

        {sizes.length === 0 && templates.length === 0 && siteHits === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing matches that search.</p>
        ) : null}
      </div>
    </div>
  );
}

function SitePagesPanel({
  query,
  onFilteredCount,
}: {
  query: string;
  onFilteredCount: (n: number) => void;
}) {
  const [pages, setPages] = useState<SitePageMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void fetchSitePages()
      .then((list) => {
        if (live) setPages(list);
      })
      .catch((err: unknown) => {
        if (live) {
          setError(err instanceof Error ? err.message : "Could not load saved pages.");
        }
      });
    return () => {
      live = false;
    };
  }, []);

  const filtered = (pages ?? []).filter(
    (p) =>
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query),
  );

  useEffect(() => {
    onFilteredCount(pages === null ? 1 : filtered.length);
  }, [pages, filtered.length, onFilteredCount]);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (pages !== null && filtered.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <HardDrive className="size-3.5" />
        On this site
      </h2>
      {pages === null ? (
        <p className="text-sm text-muted-foreground">Loading saved pages…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((page) => (
            <SitePageCard
              key={page.id}
              meta={page}
              onRemoved={() =>
                setPages((cur) => (cur ?? []).filter((p) => p.id !== page.id))
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SitePageCard({
  meta,
  onRemoved,
}: {
  meta: SitePageMeta;
  onRemoved: () => void;
}) {
  const [record, setRecord] = useState<SitePageRecord | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    void fetchSitePage(meta.id)
      .then((raw) => {
        if (!live) return;
        const migrated = migrateDocument(raw.page, raw.layers);
        setRecord({ ...raw, page: migrated.page, layers: migrated.layers });
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [meta.id]);

  const thumb = record ? (
    <PagePreview
      page={record.page}
      layers={record.layers}
      maxWidth={280}
      maxHeight={196}
    />
  ) : (
    <span
      className="rounded-sm border border-foreground/15 bg-card"
      style={{
        width: Math.min(160, meta.width / 4),
        height: Math.min(160, meta.height / 4),
      }}
    />
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card/90 text-left transition hover:border-primary/50 hover:bg-card"
        >
          <span className="flex h-52 items-center justify-center bg-black/35 p-3">
            {failed ? (
              <span className="px-3 text-center text-[11px] text-muted-foreground">
                Could not load this preview.
              </span>
            ) : (
              thumb
            )}
          </span>
          <span className="min-w-0 p-3">
            <span className="block truncate text-sm font-medium">{meta.name}</span>
            <span className="mt-1 block text-[11px] tabular-nums text-muted-foreground">
              {meta.width} × {meta.height}
            </span>
            <span className="mt-1 block text-[11px] text-muted-foreground/80">
              {new Date(meta.savedAt).toLocaleString()}
            </span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="z-[80] max-h-[min(92dvh,900px)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{meta.name}</DialogTitle>
          <DialogDescription>
            Saved on this site {new Date(meta.savedAt).toLocaleString()}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[min(64vh,640px)] items-center justify-center overflow-auto rounded-lg bg-black/40 p-3">
          {record ? (
            <PagePreview
              page={record.page}
              layers={record.layers}
              maxWidth={720}
              maxHeight={560}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {failed ? "Could not load this preview." : "Loading preview…"}
            </p>
          )}
        </div>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {meta.width} × {meta.height}
        </p>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={async () => {
              await removeSitePage(meta.id);
              onRemoved();
            }}
          >
            Remove
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={() => void openSitePage(meta.id)}>Open this page</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const { page, layers } = useMemo(() => templatePreviewContent(item), [item]);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card/90 text-left transition hover:border-primary/50 hover:bg-card"
        >
          <span className="flex h-52 items-center justify-center bg-black/35 p-3">
            <PagePreview
              page={page}
              layers={layers}
              maxWidth={280}
              maxHeight={196}
            />
          </span>
          <span className="min-w-0 p-3">
            <span className="block text-sm font-medium">{item.name}</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {item.blurb}
            </span>
            <span className="mt-2 block text-[11px] tabular-nums text-muted-foreground/80">
              {page.width} × {page.height}
            </span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="z-[80] max-h-[min(92dvh,900px)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>{item.blurb}</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[min(64vh,640px)] items-center justify-center overflow-auto rounded-lg bg-black/40 p-3">
          <PagePreview
            page={page}
            layers={layers}
            maxWidth={720}
            maxHeight={560}
          />
        </div>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {page.width} × {page.height}
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button
            onClick={() => useEditorStore.getState().loadTemplate(item.id)}
          >
            Use this layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
