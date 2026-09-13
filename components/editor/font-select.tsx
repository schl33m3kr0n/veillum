"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getCustomFonts,
  importFontFile,
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
  const custom = useSyncExternalStore(
    subscribeCustomFonts,
    getCustomFonts,
    getCustomFonts,
  );

  useEffect(() => {
    void restoreCustomFonts();
  }, []);

  const bundled = new Set<string>(FONT_OPTIONS.map((f) => f.family));
  const extras = custom.filter((f) => !bundled.has(f.family));
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hit = (text: string) => !q || text.toLowerCase().includes(q);
    const groups = FONT_GROUPS.map((group) => ({
      group,
      fonts: FONT_OPTIONS.filter(
        (font) =>
          font.group === group &&
          (hit(group) || hit(font.label) || hit(font.family)),
      ),
    })).filter((g) => g.fonts.length > 0);
    const imported = extras.filter((font) => hit(font.family));
    return { groups, imported };
  }, [query, extras]);

  const pick = (family: string) => {
    onValueChange(family);
    setOpen(false);
  };

  const pinRange = () => {
    pinTextFormatRange(useEditorStore.getState().editingTextId);
  };

  const firstMatch =
    filtered.groups[0]?.fonts[0]?.family ?? filtered.imported[0]?.family;

  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) pinRange();
          setOpen(next);
          if (!next) setQuery("");
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
            if (!useEditorStore.getState().editingTextId) {
              searchRef.current?.focus();
            }
          }}
          onPointerDown={(event) => {
            pinRange();
            const target = event.target as HTMLElement;
            if (!target.closest("input, textarea") && event.cancelable) {
              event.preventDefault();
            }
          }}
        >
          <div className="border-b border-border/70 p-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search fonts"
                aria-label="Search fonts"
                className="h-7 bg-transparent pl-7 text-sm"
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
            {filtered.imported.length > 0 && (
              <div className="py-0.5">
                <p className="px-1.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  Imported
                </p>
                {filtered.imported.map((font) => (
                  <FontRow
                    key={font.family}
                    label={font.family}
                    family={font.family}
                    selected={value === font.family}
                    stack={`"${font.family}", serif`}
                    onPick={pick}
                  />
                ))}
              </div>
            )}
            {filtered.groups.length === 0 && filtered.imported.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                No fonts match "{query.trim()}".
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        size="icon-xs"
        variant="outline"
        disabled={disabled}
        title="Import a font you own (.ttf, .otf, .woff)"
        aria-label="Import font"
        onClick={() => fileRef.current?.click()}
      >
        <Plus />
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            const family = await importFontFile(file);
            onValueChange(family);
          } catch (err) {
            console.error(err);
          }
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
  onPick,
}: {
  label: string;
  family: string;
  selected: boolean;
  stack?: string;
  onPick: (family: string) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full rounded-md px-1.5 py-1 text-left text-sm hover:bg-accent hover:text-accent-foreground",
        selected && "bg-accent/70",
      )}
      style={{ fontFamily: stack ?? cssFontFamily(family) }}
      onPointerDown={(event) => {
        if (event.cancelable) event.preventDefault();
        pinTextFormatRange(useEditorStore.getState().editingTextId);
      }}
      onClick={() => onPick(family)}
    >
      {label}
    </button>
  );
}
