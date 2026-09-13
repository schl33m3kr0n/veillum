"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { FolderOpen, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getCustomFontFamilies,
  getCustomFonts,
  importFontFiles,
  removeCustomFont,
  restoreCustomFonts,
  subscribeCustomFonts,
} from "@/lib/custom-fonts";
import { useEditorStore } from "@/lib/editor-store";
import { cssFontFamily } from "@/lib/fonts";
import { pinTextFormatRange } from "@/lib/text-spans";
import { FONT_GROUPS, FONT_OPTIONS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FontSelect({
  value,
  onValueChange,
  disabled,
  className,
}: {
  value: string;
  onValueChange: (family: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const custom = useSyncExternalStore(
    subscribeCustomFonts,
    getCustomFonts,
    getCustomFonts,
  );

  useEffect(() => {
    void restoreCustomFonts();
  }, []);

  const bundled = new Set<string>(FONT_OPTIONS.map((f) => f.family));
  const extras = useMemo(
    () => getCustomFontFamilies().filter((family) => !bundled.has(family)),
    [custom],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hit = (text: string) => !q || text.toLowerCase().includes(q);
    const groups = FONT_GROUPS.map((group) => ({
      group,
      fonts: FONT_OPTIONS.filter(
        (font) =>
          font.group === group && (hit(font.label) || hit(font.family)),
      ),
    })).filter((g) => g.fonts.length > 0);
    const imported = extras.filter((family) => hit(family));
    return { groups, imported };
  }, [query, extras]);

  const pick = (family: string) => {
    onValueChange(family);
    setOpen(false);
    setError(null);
  };

  const firstMatch =
    filtered.imported[0] ?? filtered.groups[0]?.fonts[0]?.family;
  const firstMatchRef = useRef(firstMatch);
  firstMatchRef.current = firstMatch;

  useEffect(() => {
    if (!open) return;
    const focus = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const field = searchRef.current;
      const target = event.target as HTMLElement | null;
      const inSearch =
        target === field || !!target?.closest("[data-font-search]");
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        return;
      }
      if (event.key === "Enter") {
        const match = firstMatchRef.current;
        if (!match) return;
        event.preventDefault();
        event.stopPropagation();
        pick(match);
        return;
      }
      if (inSearch) return;
      if (event.key === "Backspace") {
        event.preventDefault();
        event.stopPropagation();
        setQuery((value) => value.slice(0, -1));
        field?.focus();
        return;
      }
      if (event.key.length === 1) {
        event.preventDefault();
        event.stopPropagation();
        setQuery((value) => value + event.key);
        field?.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.cancelAnimationFrame(focus);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const pinRange = () => {
    pinTextFormatRange(useEditorStore.getState().editingTextId);
  };

  const addFromFiles = async (list: FileList | File[] | null) => {
    const files = list ? [...list] : [];
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const families = await importFontFiles(files);
      const next = families[families.length - 1];
      if (next) onValueChange(next);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that font.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) pinRange();
          setOpen(next);
          if (!next) {
            setQuery("");
            setError(null);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-label="Font"
            className="h-7 min-w-0 flex-1 justify-start px-2.5 font-normal"
            onPointerDown={pinRange}
            style={{ fontFamily: cssFontFamily(value) }}
          >
            <span className="truncate">{value || "Font"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          data-text-format-ui
          className="w-72 gap-0 p-0"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus();
          }}
          onPointerDown={(event) => {
            pinRange();
            const target = event.target as HTMLElement;
            if (!target.closest("input, textarea, button") && event.cancelable) {
              event.preventDefault();
            }
          }}
        >
          <div className="border-b border-border/70 p-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                data-font-search
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search fonts"
                aria-label="Search fonts"
                className="h-7 w-full rounded-lg border border-input bg-transparent py-1 pr-2 pl-7 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                onFocus={pinRange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && firstMatch) {
                    e.preventDefault();
                    pick(firstMatch);
                  }
                }}
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {filtered.imported.length > 0 && (
              <div className="py-0.5">
                <p className="px-1.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  From files
                </p>
                {filtered.imported.map((family) => (
                  <FontRow
                    key={family}
                    label={family}
                    family={family}
                    selected={value === family}
                    stack={`"${family}", serif`}
                    removable
                    onPick={pick}
                    onRemove={() => {
                      void removeCustomFont(family);
                      if (value === family) onValueChange("Instrument Sans");
                    }}
                  />
                ))}
              </div>
            )}
            {filtered.groups.map((group) => (
              <div key={group.group} className="py-0.5">
                <p className="px-1.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {group.group}
                </p>
                {group.fonts.map((font) => (
                  <FontRow
                    key={font.family}
                    label={font.label}
                    family={font.family}
                    selected={value === font.family}
                    onPick={pick}
                  />
                ))}
              </div>
            ))}
            {filtered.groups.length === 0 && filtered.imported.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                No fonts match "{query.trim()}".
              </p>
            )}
          </div>
          <div className="border-t border-border/70 p-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full justify-start"
              disabled={disabled || busy}
              onClick={() => fileRef.current?.click()}
            >
              <FolderOpen />
              {busy ? "Adding…" : "From file…"}
            </Button>
            <p className="px-0.5 pt-1 text-[10px] leading-snug text-muted-foreground">
              Open a .ttf, .otf, .woff, or .woff2 from this computer. Drop several at once.
            </p>
            {error ? (
              <p className="px-0.5 pt-1 text-[11px] text-destructive">{error}</p>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
        className="hidden"
        onChange={(e) => {
          const list = e.target.files;
          e.target.value = "";
          void addFromFiles(list);
        }}
      />
    </div>
  );
}

function FontRow({
  label,
  family,
  selected,
  stack,
  removable,
  onPick,
  onRemove,
}: {
  label: string;
  family: string;
  selected: boolean;
  stack?: string;
  removable?: boolean;
  onPick: (family: string) => void;
  onRemove?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center rounded-md hover:bg-accent hover:text-accent-foreground",
        selected && "bg-accent/70",
      )}
    >
      <button
        type="button"
        className="min-w-0 flex-1 px-1.5 py-1 text-left text-sm"
        style={{ fontFamily: stack ?? cssFontFamily(family) }}
        onPointerDown={(event) => {
          if (event.cancelable) event.preventDefault();
          pinTextFormatRange(useEditorStore.getState().editingTextId);
        }}
        onClick={() => onPick(family)}
      >
        <span className="truncate">{label}</span>
      </button>
      {removable ? (
        <button
          type="button"
          className="shrink-0 px-1.5 py-1 text-muted-foreground hover:text-destructive"
          aria-label={`Remove ${family}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
